import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { KanbanColumn } from '../components/Crm/KanbanColumn';
import {
    Lead,
    LeadStatus,
    BOARD_COLUMNS,
    normalizeStatus,
} from '../types/lead';
import { LayoutDashboard, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

/** Converte um raw row do banco para um Lead tipado */
const toLeadFromRow = (row: Record<string, unknown>): Lead => ({
    id: row.id as string,
    nome: (row.nome as string | null) ?? null,
    telefone: (row.telefone as string) ?? '',
    status: normalizeStatus(row.status as string),
    mensagem: (row.mensagem as string | null) ?? null,
    updated_at: (row.updated_at as string | undefined),
});

export const Crm = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);

    /**
     * Set de IDs que o proprio usuario moveu via drag-drop.
     * Usado para diferenciar atualizacoes locais de atualizacoes vindas do n8n.
     */
    const localMoveIds = useRef<Set<string>>(new Set());

    // ── Busca todos os leads da tabela 'leads' e cruza com agendamentos ───────
    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Pega os Leads
            const { data: leadsData, error: leadsError } = await supabase
                .from('leads')
                .select('id, nome, telefone, status, mensagem, updated_at')
                .order('id', { ascending: false });

            if (leadsError) throw leadsError;

            // 2. Pega Agendamentos com status relevantes
            const { data: aptData, error: aptError } = await supabase
                .from('appointments')
                .select('tempGuestPhone, tempGuestName, patientId, status') 
                .in('status', ['PENDENTE', 'CONFIRMADO', 'CANCELADO'])
                .order('date', { ascending: false })
                .order('time', { ascending: false });

            if (aptError) throw aptError;

            // Precisamos dos Patients tbm
            const { data: patientsData, error: patientsError } = await supabase
                .from('patients')
                .select('id, phone, name');
                
            if (patientsError) throw patientsError;

            // Constrói um array plano de agendamentos contendo phone e name para dar match
            const aptMatches = aptData.map(apt => {
                let p = apt.tempGuestPhone;
                let n = apt.tempGuestName;
                if ((!p || !n) && apt.patientId) {
                    const patient = patientsData.find(pt => pt.id === apt.patientId);
                    p = p || patient?.phone;
                    n = n || patient?.name;
                }
                return { phone: p, name: n, status: apt.status };
            }).filter(item => item.phone || item.name); // Filter those with at least one matching vector

            // 3. Monta e junta localmente
            const rawLeads = leadsData || [];
            
            const processedLeads = rawLeads.map(row => {
                const leadObj = toLeadFromRow(row as Record<string, unknown>);
                const cleanTelefone = leadObj.telefone.replace(/\D/g, '');
                const cleanName = (leadObj.nome || '').trim().toLowerCase();
                
                // Pega o agendamento mais recente que dê match
                const matchNode = aptMatches.find(apt => {
                    let matchByPhone = false;
                    let matchByName = false;

                    if (apt.phone && cleanTelefone) {
                        const cleanP = apt.phone.replace(/\D/g, '');
                        matchByPhone = cleanP.length >= 8 && (cleanTelefone.includes(cleanP) || cleanP.includes(cleanTelefone));
                    }
                    if (apt.name && cleanName) {
                        const cleanAptName = apt.name.trim().toLowerCase();
                        matchByName = cleanName === cleanAptName || cleanAptName.includes(cleanName) || cleanName.includes(cleanAptName);
                    }

                    return matchByPhone || matchByName;
                });

                leadObj.agendamento_status = matchNode ? (matchNode.status as 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO') : null;
                return leadObj;
            });

            // 4. Ordena: quem tem agendamento fica no topo (-1)
            processedLeads.sort((a, b) => {
                const aHasApt = !!a.agendamento_status;
                const bHasApt = !!b.agendamento_status;
                if (aHasApt && !bHasApt) return -1;
                if (!aHasApt && bHasApt) return 1;
                return 0; // mantém a ordem id decrescente original (mais novo no topo)
            });

            setLeads(processedLeads);
        } catch (err) {
            console.error('[CRM] Erro ao buscar leads:', err);
            toast.error('Erro ao carregar leads.');
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Realtime: canal único vigiando tabelas 'leads' e 'appointments' ───────
    useEffect(() => {
        fetchLeads();

        const channel = supabase
            .channel('crm-realtime-combined')
            // Escuta Leads
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leads' },
                (payload) => {
                    console.log('[CRM Realtime Leads]', payload.eventType, payload);
                    
                    if (payload.eventType === 'INSERT') {
                        // Não sabemos se o cara inseriu com pending, então forçamos refresh para facilitar
                        fetchLeads();
                        const newLead = toLeadFromRow(payload.new as Record<string, unknown>);
                        toast.success(
                            `Novo lead: ${newLead.nome || newLead.telefone}`,
                            { icon: '👋', duration: 3500 }
                        );

                    } else if (payload.eventType === 'UPDATE') {
                        const updated = toLeadFromRow(payload.new as Record<string, unknown>);
                        
                        // Recalcula ordenacao completa via fetchLeads para nao quebrar a UI
                        // fetchLeads ja traz ordenado.
                        fetchLeads();

                        // Exibe toast apenas quando a mudanca NAO veio do usuario (veio do n8n)
                        if (!localMoveIds.current.has(updated.id)) {
                            const nomeLead = updated.nome || updated.telefone;
                            toast(
                                `🤖 Status do Lead atualizado pela IA\n${nomeLead}`,
                                {
                                    icon: '⚡',
                                    duration: 4000,
                                    style: {
                                        background: '#1e1b4b',
                                        color: '#e0e7ff',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
                                        whiteSpace: 'pre-line',
                                    },
                                }
                            );
                        }

                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = (payload.old as { id?: string })?.id;
                        if (deletedId) setLeads(prev => prev.filter(l => l.id !== deletedId));
                    }
                }
            )
            // Escuta Appointments
            .on(
                 'postgres_changes',
                 { event: '*', schema: 'public', table: 'appointments' },
                 (payload) => {
                     console.log('[CRM Realtime Appointments]', payload.eventType);
                     // Se houve mudanca num appointment, simplesmente rodamos a busca inteira do CRM 
                     // para cruzar os dados, acender e ordenar prioritariamente a lista.
                     fetchLeads();
                 }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
                if (status === 'SUBSCRIBED') console.log('[CRM Realtime] ✅ Conectado.');
                if (status === 'CHANNEL_ERROR') console.warn('[CRM Realtime] ⚠️ Erro de canal.');
            });

        return () => { supabase.removeChannel(channel); };
    }, [fetchLeads]);

    // ── Drag & Drop: apenas UPDATE no campo 'status' ──────────────────────────
    const handleDropCard = async (toStatus: LeadStatus, leadId: string) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead || lead.status === toStatus) return;

        // Marca como movimento MANUAL do usuario para suprimir o toast do n8n
        localMoveIds.current.add(leadId);
        // Remove da lista apos 5 s (tempo suficiente para o Realtime retornar o UPDATE)
        setTimeout(() => localMoveIds.current.delete(leadId), 5000);

        // Atualização otimista — UI reage imediatamente
        setLeads(prev =>
            prev.map(l =>
                l.id === leadId
                    ? { ...l, status: toStatus, updated_at: new Date().toISOString() }
                    : l
            )
        );

        try {
            const { error } = await supabase
                .from('leads')
                .update({
                    status: toStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', leadId);

            if (error) throw error;
        } catch (err) {
            console.error('[CRM] Erro ao atualizar status:', err);
            fetchLeads(); // reverte
            toast.error('Erro ao mover lead. Revertendo...');
        }
    };

    const totalLeads = leads.length;

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
                <span className="text-slate-500 font-medium">Carregando CRM...</span>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-5 animate-in fade-in duration-500 overflow-hidden">

            {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <LayoutDashboard className="text-cyan-600" size={32} />
                        CRM / Funil de Vendas
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Acompanhe a evolução dos leads captados pela inteligência artificial.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Indicador Realtime */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                        ${isConnected
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}
                    >
                        {isConnected
                            ? <><Wifi size={12} /> Ao vivo</>
                            : <><WifiOff size={12} /> Reconectando...</>
                        }
                    </div>

                    {/* Total de leads */}
                    <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600">
                        {totalLeads} {totalLeads === 1 ? 'lead' : 'leads'}
                    </div>

                    {/* Refresh manual */}
                    <button
                        onClick={fetchLeads}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-xs font-medium shadow-sm"
                    >
                        <RefreshCw size={12} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* ── Quadro Kanban ──────────────────────────────────────────────── */}
            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {BOARD_COLUMNS.map(columnStatus => (
                    <KanbanColumn
                        key={columnStatus}
                        status={columnStatus}
                        leads={leads.filter(l => l.status === columnStatus)}
                        onDropCard={handleDropCard}
                    />
                ))}
            </div>
        </div>
    );
};
