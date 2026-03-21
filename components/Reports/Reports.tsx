
import React, { useState, useMemo } from 'react';
import { Calendar, ChevronDown, DollarSign, Activity, Users, UserCheck } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell 
} from 'recharts';
import { User } from '../../types';
import { useAppointments } from '../../src/hooks/useAppointments';
import { usePatients } from '../../src/hooks/usePatients';
import { parseISO, isAfter, startOfMonth, startOfWeek, startOfYear, startOfQuarter, endOfDay } from 'date-fns';

interface ReportsProps {
  user: User;
}

const COLORS_PIE = ['#0891b2', '#2dd4bf', '#818cf8', '#f472b6', '#fbbf24', '#f59e0b', '#3b82f6', '#10b981'];

export const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [period, setPeriod] = useState('Mensal');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const { appointments } = useAppointments();

  // Handle personal date range logic
  const filteredAppointments = useMemo(() => {
    const now = new Date();
    let startDate = now;

    if (period === 'Semanal') startDate = startOfWeek(now);
    else if (period === 'Mensal') startDate = startOfMonth(now);
    else if (period === 'Trimestral') startDate = startOfQuarter(now);
    else if (period === 'Anual') startDate = startOfYear(now);
    
    return appointments.filter(a => {
      if (!a.date) return false;
      const d = parseISO(a.date);
      if (period === 'Personalizado') {
        if (!customStartDate || !customEndDate) return true;
        const s = parseISO(customStartDate);
        const e = endOfDay(parseISO(customEndDate));
        return (d >= s && d <= e);
      } else {
        return d >= startDate;
      }
    });
  }, [period, customStartDate, customEndDate, appointments]);

  // Valid appointments calculations should only include 'REALIZADO' or 'CONFIRMADO'
  const validAppointments = useMemo(() => {
    return filteredAppointments.filter(a => {
      const status = (a.status || '').toUpperCase();
      return status === 'CONFIRMADO' || status === 'REALIZADO';
    });
  }, [filteredAppointments]);

  // Data Graphics 1: Services by Professional (Stacked Bars)
  const { professionalServicesData, uniqueServices } = useMemo(() => {
    const profMap: Record<string, any> = {};
    const servicesSet = new Set<string>();

    validAppointments.forEach(a => {
      const pName = a.physio || 'Não Atribuído';
      const sName = a.type || 'Outros';
      
      if (!profMap[pName]) profMap[pName] = { name: pName };
      profMap[pName][sName] = (profMap[pName][sName] || 0) + 1;
      servicesSet.add(sName);
    });

    return { 
      professionalServicesData: Object.values(profMap), 
      uniqueServices: Array.from(servicesSet) 
    };
  }, [validAppointments]);

  // Data Graphics 2: Revenue per Professional (Pie)
  const professionalRevenueData = useMemo(() => {
    const profMap: Record<string, number> = {};
    validAppointments.forEach(a => {
      const pName = a.physio || 'Não Atribuído';
      profMap[pName] = (profMap[pName] || 0) + (Number(a.value) || 0);
    });

    return Object.keys(profMap).map(k => ({
      name: k,
      value: profMap[k]
    })).filter(x => x.value > 0).sort((a,b) => b.value - a.value);
  }, [validAppointments]);

  // Table summary
  const professionalSummary = useMemo(() => {
    const profMap: Record<string, { name: string; count: number; revenue: number }> = {};
    validAppointments.forEach(a => {
      const pName = a.physio || 'Não Atribuído';
      if (!profMap[pName]) profMap[pName] = { name: pName, count: 0, revenue: 0 };
      profMap[pName].count += 1;
      profMap[pName].revenue += (Number(a.value) || 0);
    });
    return Object.values(profMap).sort((a, b) => b.revenue - a.revenue);
  }, [validAppointments]);

  // KPIs Header
  const totalRevenue = professionalSummary.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalAppointments = professionalSummary.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Desempenho Profissional</h2>
          <p className="text-slate-500 text-sm font-medium">Análise de produtividade e rendimento na clínica baseada em agendamentos CONFIRMADOS.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {period === 'Personalizado' && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in">
              <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="text-xs font-bold text-slate-600 outline-none" />
              <span className="text-slate-300">-</span>
              <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="text-xs font-bold text-slate-600 outline-none" />
            </div>
          )}
          
          <div className="relative group">
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                if (e.target.value !== 'Personalizado') {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }
              }}
              className="appearance-none bg-white border border-slate-100 pl-4 pr-10 py-3 rounded-2xl text-xs font-black text-slate-600 outline-none shadow-sm cursor-pointer"
            >
              <option>Semanal</option>
              <option>Mensal</option>
              <option>Trimestral</option>
              <option>Anual</option>
              <option>Personalizado</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturamento Global</p>
            <h4 className="text-xl font-black text-slate-800">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-50 text-[var(--primary-color)] rounded-2xl flex items-center justify-center shrink-0">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atendimentos Bem-Sucedidos</p>
            <h4 className="text-xl font-black text-slate-800">{totalAppointments} Serviços</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4 hidden lg:flex">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket Médio (Geral)</p>
            <h4 className="text-xl font-black text-slate-800">
              R$ {totalAppointments > 0 ? (totalRevenue / totalAppointments).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
            </h4>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Gráfico 1: Barras - Quantidade de Serviços Segmentados */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Atendimentos por Profissional</h3>
          {professionalServicesData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={professionalServicesData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                  
                  {uniqueServices.map((service, index) => (
                    <Bar key={service} dataKey={service} stackId="a" fill={COLORS_PIE[index % COLORS_PIE.length]} radius={index === uniqueServices.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} barSize={40} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm font-bold text-slate-400">
              Nenhum atendimento confirmado neste período.
            </div>
          )}
        </div>

        {/* Gráfico 2: Pizza - Receita Gerada */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Distribuição de Faturamento</h3>
          {professionalRevenueData.length > 0 ? (
            <div className="h-[300px] w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={professionalRevenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                  >
                    {professionalRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm font-bold text-slate-400">
              Sem dados de receita para o período.
            </div>
          )}
        </div>

      </div>

      {/* SUMMARY TABLE */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center gap-3">
          <Users className="text-[var(--primary-color)]" size={24} />
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Síntese de Produtores</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profissional</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qtd. Serviços (Finalizados)</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Faturamento Trazido</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ticket Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {professionalSummary.length > 0 ? (
                professionalSummary.map((prof, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-sm text-slate-700">{prof.name}</div>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-600">
                      {prof.count} <span className="text-xs font-bold text-slate-400 ml-1">vendas</span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-emerald-600 text-base">
                      R$ {prof.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-5 text-right font-bold text-sm text-slate-500">
                      R$ {(prof.count > 0 ? prof.revenue / prof.count : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-center text-sm font-bold text-slate-400">
                    Nenhum serviço confirmado neste período (Selecione outro filtro).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
