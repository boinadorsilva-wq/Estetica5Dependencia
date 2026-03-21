import React, { useMemo, useState, useEffect } from 'react';
import {
    CalendarClock,
    CheckCircle2,
    HelpCircle,
    Gift,
    ChevronRight,
    Search,
    Info
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { format, subDays, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useAppointments } from '../hooks/useAppointments';
import { usePatients } from '../hooks/usePatients';
import { useScheduleSettings } from '../hooks/useScheduleSettings';

export const Dashboard = () => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true) }, []);
    const { appointments } = useAppointments();
    const { patients } = usePatients();
    const { settings: scheduleSettings } = useScheduleSettings();

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const currentMonth = new Date().getMonth();

    // 1. KPI Cards Data
    const agendaHoje = useMemo(() => {
        return appointments.filter(apt => apt.date === todayStr && apt.status !== 'CANCELADO').length;
    }, [appointments, todayStr]);

    const sessoesFinalizadas = useMemo(() => {
        return appointments.filter(apt => apt.date === todayStr && (apt.status === 'CONCLUIDO' || apt.status === 'REALIZADO' || apt.status === 'FINALIZADO')).length;
    }, [appointments, todayStr]);

    const pedidosPendentes = useMemo(() => {
        return appointments.filter(apt => apt.status === 'PENDENTE').length;
    }, [appointments]);

    const aniversariantesMes = useMemo(() => {
        return patients.filter(p => {
            if (!p.birthDate && !p.birth_date) return false;
            try {
                const bDateStr = p.birthDate || p.birth_date;
                // Basic check for yyyy-mm-dd
                const bDate = new Date(bDateStr);
                return bDate.getMonth() === currentMonth;
            } catch {
                return false;
            }
        }).length;
    }, [patients, currentMonth]);

    // 2. Chart Data (Last 7 Days)
    const chartData = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayLabel = format(date, 'EEE', { locale: ptBR }); // Seg, Ter, etc.

            const dayAppointments = appointments.filter(apt => apt.date === dateStr);

            // "Realizados" as anything that isn't cancelled and isn't pending (e.g. Confirmado, Realizado, Concluido, etc.)
            const realizados = dayAppointments.filter(apt => apt.status !== 'CANCELADO' && apt.status !== 'PENDENTE').length;
            const cancelados = dayAppointments.filter(apt => apt.status === 'CANCELADO').length;

            data.push({
                name: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
                realizados,
                cancelados
            });
        }
        return data;
    }, [appointments]);

    // Calculate Leads Generated Outside Business Hours (Last 7 Days)
    const outOfHoursLeads = useMemo(() => {
        if (!patients.length || !scheduleSettings.length) return 0;

        let count = 0;
        const now = new Date();
        const startDate = subDays(now, 7); // Dashboard mostly uses 7 days scale

        patients.forEach(patient => {
            if (!patient.createdAt) return;
            const createdDate = parseISO(patient.createdAt);

            if (!isAfter(createdDate, startDate)) return;

            const dayOfWeek = createdDate.getDay();
            const hour = createdDate.getHours();
            const minute = createdDate.getMinutes();
            const timeNum = hour + (minute / 60);

            const daySetting = scheduleSettings.find(s => s.dia_semana === dayOfWeek);

            if (!daySetting || !daySetting.esta_ativo) {
                count++;
                return;
            }

            const getDecimalTime = (timeStr: string) => {
                if (!timeStr) return null;
                const [h, m] = timeStr.split(':').map(Number);
                return h + (m / 60);
            };

            const startWork = getDecimalTime(daySetting.hora_inicio);
            const endWork = getDecimalTime(daySetting.hora_fim);
            const startLunch = getDecimalTime(daySetting.almoco_inicio || '');
            const endLunch = getDecimalTime(daySetting.almoco_fim || '');

            let isOutside = false;

            if ((startWork !== null && timeNum < startWork) ||
                (endWork !== null && timeNum >= endWork)) {
                isOutside = true;
            } else if (startLunch !== null && endLunch !== null &&
                timeNum >= startLunch && timeNum < endLunch) {
                isOutside = true;
            }

            if (isOutside) {
                count++;
            }
        });

        return count;
    }, [patients, scheduleSettings]);

    // 3. Side Widget Data
    const proximosPendentes = useMemo(() => {
        return appointments
            .filter(apt => apt.status === 'PENDENTE' && apt.date >= todayStr)
            .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
            .slice(0, 6);
    }, [appointments, todayStr]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bem-vindo(a)!</h1>
                <p className="text-slate-500 font-medium">Dashboard de Gestão da Clínica.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <CalendarClock size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Agenda de Hoje</p>
                        <h3 className="text-3xl font-black text-slate-800">{agendaHoje}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Sessões Finalizadas</p>
                        <h3 className="text-3xl font-black text-slate-800">{sessoesFinalizadas}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <HelpCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pedidos Pendentes</p>
                        <h3 className="text-3xl font-black text-slate-800">{pedidosPendentes}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Gift size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Aniversariantes do Mês</p>
                        <h3 className="text-3xl font-black text-slate-800">{aniversariantesMes}</h3>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Central Chart */}
                <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                    <div>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Atividade Integrada (semana) / Distribuição de bolas</h3>
                                <p className="text-slate-500 text-sm font-medium">Agendamentos Realizados vs Cancelamentos</p>
                            </div>
                        </div>
                        <div className="w-full h-[250px]">
                            {isMounted && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRealizados" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCancelados" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                                    />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                    <Area
                                        name="Realizados"
                                        type="monotone"
                                        dataKey="realizados"
                                        stroke="var(--primary-color)"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRealizados)"
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                    <Area
                                        name="Cancelados"
                                        type="monotone"
                                        dataKey="cancelados"
                                        stroke="#ef4444"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCancelados)"
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Side Widget */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 flex flex-col">
                        <div className="mb-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Próximos Pendentes</h3>
                                <p className="text-slate-500 text-sm font-medium">Aguardando confirmação</p>
                            </div>
                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                {proximosPendentes.length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                            {proximosPendentes.length > 0 ? (
                                proximosPendentes.map((apt) => (
                                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800 text-sm group-hover:text-cyan-600 transition-colors">
                                                {apt.patient}
                                            </span>
                                            <span className="text-xs font-medium text-slate-500 mt-0.5">
                                                {apt.type || 'Sessão Padrão'}
                                            </span>
                                            <span className="text-xs font-bold text-orange-500 mt-1 flex items-center gap-1">
                                                {format(new Date(`${apt.date}T${apt.time}`), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                            </span>
                                        </div>
                                        <button className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-cyan-50 hover:text-cyan-600" aria-label="Ver Pormenores">
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-10">
                                    <Search size={32} className="text-slate-300" />
                                    <p className="text-sm font-medium text-center">Nenhum atendimento pendente para os próximos dias.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
