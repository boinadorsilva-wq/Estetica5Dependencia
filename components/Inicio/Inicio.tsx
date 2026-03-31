import React, { useState, useMemo } from 'react';
import { User, Appointment, Patient, AppointmentStatus } from '../../types';
import { Calendar, Clock, CheckCircle, XCircle, User as UserIcon, MessageCircle, AlertCircle, ChevronRight, Cake } from 'lucide-react';
import { useAppointments } from '../../src/hooks/useAppointments';
import { usePatients } from '../../src/hooks/usePatients';

interface InicioProps {
  user: User;
  onNavigateToPatient?: (id: string) => void;
}

export const Inicio: React.FC<InicioProps> = ({ user, onNavigateToPatient }) => {
  const { appointments } = useAppointments();
  const { patients } = usePatients();

  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<'TODOS' | AppointmentStatus>('TODOS');

  // Filtrar agendamentos pela data selecionada
  const dayAppointments = useMemo(() => {
    return appointments.filter(a => a.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate]);

  // Filtrar ainda mais pela tab ativa (Todos, Pendentes, etc)
  const filteredAppointments = useMemo(() => {
    if (filterStatus === 'TODOS') return dayAppointments;
    if (filterStatus === AppointmentStatus.CONFIRMADO) {
      return dayAppointments.filter(a => a.status === AppointmentStatus.CONFIRMADO || a.status === AppointmentStatus.REALIZADO);
    }
    return dayAppointments.filter(a => a.status === filterStatus);
  }, [dayAppointments, filterStatus]);

  // Contadores
  const totals = useMemo(() => {
    return {
      all: dayAppointments.length,
      pendentes: dayAppointments.filter(a => a.status === AppointmentStatus.PENDENTE || a.status === AppointmentStatus.AGENDADO).length,
      confirmados: dayAppointments.filter(a => a.status === AppointmentStatus.CONFIRMADO || a.status === AppointmentStatus.REALIZADO).length,
      cancelados: dayAppointments.filter(a => a.status === AppointmentStatus.CANCELADO).length,
    };
  }, [dayAppointments]);

  // Aniversariantes do dia
  const birthdayPatients = useMemo(() => {
    const [, month, day] = selectedDate.split('-');
    const monthDay = `${month}-${day}`;
    return patients.filter(p => {
      if (!p.birthDate && !p.birth_date) return false;
      const bd = p.birthDate || p.birth_date;
      if (!bd) return false;
      // Alguns bd podem ser dd/mm/yyyy ou yyyy-mm-dd
      if (bd.includes('-')) {
        return bd.substring(5) === monthDay;
      } else if (bd.includes('/')) {
        const parts = bd.split('/');
        if (parts.length === 3) {
          return `${parts[1]}-${parts[0]}` === monthDay;
        }
      }
      return false;
    });
  }, [patients, selectedDate]);

  const getPatientName = (patientId: string) => {
    return patients.find(p => p.id === patientId)?.name || 'Paciente não encontrado';
  };

  const openWhatsApp = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient || !patient.phone) return;
    const cleanPhone = patient.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=Olá%20${encodeURIComponent(patient.name)},%20feliz%20aniversário!`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-500">
      {/* Header com Calendário */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            Olá, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Aqui está o resumo da sua agenda administrativa.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-sm transition-colors"
          >
            Hoje
          </button>
          <div className="relative">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-4 pr-4 py-2 bg-[var(--primary-color)] text-white font-bold rounded-xl border-none outline-none focus:ring-4 focus:ring-cyan-500/20 cursor-pointer text-sm"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[var(--primary-color)] transition-colors">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total do Dia</p>
            <h2 className="text-3xl font-black text-slate-800">{totals.all}</h2>
          </div>
          <div className="w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center text-[var(--primary-color)] group-hover:scale-110 transition-transform">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-amber-400 transition-colors">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Pendentes</p>
            <h2 className="text-3xl font-black text-slate-800">{totals.pendentes}</h2>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-400 transition-colors">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Confirmados</p>
            <h2 className="text-3xl font-black text-slate-800">{totals.confirmados}</h2>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-red-400 transition-colors">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Cancelados</p>
            <h2 className="text-3xl font-black text-slate-800">{totals.cancelados}</h2>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
            <XCircle size={24} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Timeline (Lista vertical de atendimentos) */}
        <div className="flex-1 bg-white border border-gray-100 rounded-3xl shadow-sm p-6 overflow-hidden flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Clock size={20} className="text-[var(--primary-color)]" /> Agendamentos do Dia
            </h2>
            
            {/* Abas de filtro */}
            <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-hide">
              <button 
                onClick={() => setFilterStatus('TODOS')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterStatus === 'TODOS' ? 'bg-white text-[var(--primary-color)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Todos
              </button>
              <button 
                onClick={() => setFilterStatus(AppointmentStatus.PENDENTE)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterStatus === AppointmentStatus.PENDENTE ? 'bg-white text-[var(--primary-color)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Pendentes
              </button>
              <button 
                onClick={() => setFilterStatus(AppointmentStatus.CONFIRMADO)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterStatus === AppointmentStatus.CONFIRMADO ? 'bg-white text-[var(--primary-color)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Confirmados
              </button>
              <button 
                onClick={() => setFilterStatus(AppointmentStatus.CANCELADO)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterStatus === AppointmentStatus.CANCELADO ? 'bg-white text-[var(--primary-color)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Cancelados
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-2 space-y-3">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map(app => {
                const patName = app.patientId ? getPatientName(app.patientId) : (app.tempGuestName || 'Convidado');
                const isPendente = app.status === AppointmentStatus.PENDENTE || app.status === AppointmentStatus.AGENDADO;
                const isConfirmado = app.status === AppointmentStatus.CONFIRMADO || app.status === AppointmentStatus.REALIZADO;
                const isCancelado = app.status === AppointmentStatus.CANCELADO;

                let statusBadgeColor = 'bg-slate-100 text-slate-600';
                if (isPendente) statusBadgeColor = 'bg-amber-100 text-amber-700';
                if (isConfirmado) statusBadgeColor = 'bg-emerald-100 text-emerald-700';
                if (isCancelado) statusBadgeColor = 'bg-red-100 text-red-700';

                return (
                  <div key={app.id} className="group relative flex items-center gap-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 p-4 rounded-2xl transition-all">
                    {/* Linha indicadora lateral */}
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-r-full
                      ${isPendente ? 'bg-amber-400' : isConfirmado ? 'bg-emerald-400' : isCancelado ? 'bg-red-400' : 'bg-slate-300'}`} 
                    />
                    
                    <div className="pl-2 w-20 shrink-0">
                      <p className="text-sm font-black text-slate-800">{app.time}</p>
                      <p className="text-[10px] font-bold text-slate-400">{app.duration} min</p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div 
                        className={`flex items-center gap-2 ${app.patientId ? 'cursor-pointer hover:underline decoration-slate-300 underline-offset-2' : ''}`}
                        onClick={() => app.patientId && onNavigateToPatient && onNavigateToPatient(app.patientId)}
                      >
                        <p className="text-sm font-bold text-slate-800 truncate">{patName}</p>
                        {app.patientId && <ChevronRight size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                      <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{app.serviceName || 'Serviço'}</p>
                    </div>

                    <div className="shrink-0">
                       <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg ${statusBadgeColor}`}>
                         {app.status}
                       </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                 <AlertCircle size={32} className="mb-2 opacity-50" />
                 <p className="text-sm font-bold">Nenhum agendamento encontrado.</p>
                 <p className="text-xs font-medium">Não há registros para este filtro hoje.</p>
              </div>
            )}
          </div>
        </div>

        {/* Aniversariantes do Dia */}
        <div className="xl:w-80 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
            <div className="absolute -top-6 -right-6 text-white/10">
              <Cake size={120} />
            </div>
            
            <h3 className="text-lg font-black flex items-center gap-2 relative z-10 mb-4">
              <Cake size={20} /> Aniversariantes
            </h3>

            <div className="space-y-3 relative z-10">
              {birthdayPatients.length > 0 ? (
                birthdayPatients.map(p => (
                  <div key={p.id} className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold truncate pr-3">{p.name || p.full_name}</p>
                    </div>
                    {p.phone && (
                      <button 
                        onClick={() => openWhatsApp(p.id)}
                        className="w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center shrink-0 hover:scale-110 transition-transform shadow-sm"
                        title="Enviar parabéns pelo WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl text-center">
                   <p className="text-sm font-medium">Nenhum aniversariante nesta data. 🥳</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
