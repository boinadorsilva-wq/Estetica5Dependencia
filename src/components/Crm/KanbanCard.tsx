import React from 'react';
import { MessageCircle, Clock, Phone } from 'lucide-react';
import { Lead, COLUMN_COLORS } from '../../types/lead';

interface KanbanCardProps {
    key?: React.Key;
    lead: Lead;
    onDragStart: (e: React.DragEvent, leadId: string) => void;
}

/** Formata o telefone no padrão brasileiro: (XX) XXXXX-XXXX */
const formatPhone = (raw: string | null | undefined): string => {
    if (!raw) return '—';
    const digits = raw.replace(/\D/g, '');
    // Remove DDI 55 se presente
    const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
    if (local.length === 11) {
        return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
    }
    if (local.length === 10) {
        return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
    }
    return raw;
};

/** Monta a URL do WhatsApp com o DDI 55 */
const buildWhatsappUrl = (raw: string | null | undefined): string => {
    if (!raw) return '#';
    const digits = raw.replace(/\D/g, '');
    const withDdi = digits.startsWith('55') ? digits : `55${digits}`;
    return `https://wa.me/${withDdi}`;
};

/** Converte a data para tempo relativo legível */
const getRelativeTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'agora mesmo';
    if (mins < 60) return `há ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `há ${hours}h`;
    return `há ${Math.floor(hours / 24)}d`;
};

export const KanbanCard = ({ lead, onDragStart }: KanbanCardProps) => {
    const colors = COLUMN_COLORS[lead.status];
    const whatsappUrl = buildWhatsappUrl(lead.telefone);

    let neonClass = '';
    if (lead.agendamento_status === 'PENDENTE') neonClass = 'status-pendente';
    else if (lead.agendamento_status === 'CONFIRMADO') neonClass = 'status-confirmado';
    else if (lead.agendamento_status === 'CANCELADO') neonClass = 'status-cancelado';

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', lead.id);
                e.dataTransfer.effectAllowed = 'move';
                onDragStart(e, lead.id);
            }}
            className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab hover:shadow-md transition-all duration-200 active:cursor-grabbing active:scale-[0.98] group ${neonClass}`}
        >
            {/* Nome + indicador de cor */}
            <div className="flex justify-between items-start mb-1 gap-2">
                <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-1">
                    {lead.nome || 'Lead sem nome'}
                </h4>
                <span className={`shrink-0 w-2.5 h-2.5 rounded-full mt-0.5 ${colors.dot}`} />
            </div>

            {/* Telefone formatado */}
            <div className="flex items-center gap-1 mb-2.5">
                <Phone size={10} className="text-slate-400 shrink-0" />
                <p className="text-[11px] text-slate-400 font-mono">
                    {formatPhone(lead.telefone)}
                </p>
            </div>

            {/* Última mensagem (resumida em 2 linhas) */}
            <p
                className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed min-h-[2rem]"
                title={lead.mensagem ?? 'Sem mensagem'}
            >
                {lead.mensagem
                    ? lead.mensagem
                    : <span className="italic text-slate-300">Sem mensagem registrada</span>
                }
            </p>

            {/* Rodapé: tempo relativo + botão WhatsApp */}
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock size={10} />
                    {getRelativeTime(lead.updated_at)}
                </span>

                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors text-[11px] font-semibold shadow-sm"
                    title={`Abrir WhatsApp: ${formatPhone(lead.telefone)}`}
                >
                    <MessageCircle size={12} />
                    Abrir WhatsApp
                </a>
            </div>
        </div>
    );
};
