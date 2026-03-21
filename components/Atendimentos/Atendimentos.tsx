
import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Edit3,
  Search,
  History,
  AlertTriangle,
  X,
  FileText,
  Upload,
  Check,
  Filter,
  Eye,
  Download,
  Calendar,
  User as UserIcon,
  ChevronDown,
  Stethoscope,
  ChevronRight,
  Lock
} from 'lucide-react';
import { User, UserRole } from '../../types';

interface AtendimentosProps {
  user: User;
}

export const Atendimentos: React.FC<AtendimentosProps> = ({ user }) => {
  const [activeView, setActiveView] = useState<'fila' | 'historico'>('fila');
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
  const [isQuickViewModalOpen, setIsQuickViewModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any>(null);

  const isAdmin = user.role === UserRole.ADMIN;

  // Filters State
  const [searchPatient, setSearchPatient] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('Este mês');
  const [filterPhysio, setFilterPhysio] = useState(isAdmin ? 'Todos' : user.name);

  // PENDENCIAS (Sessões realizadas sem evolução)
  const pendenciasMock: any[] = [];

  // HISTORICO (Evoluções concluídas)
  const historicoMock: any[] = [];

  // LOGICA DE FILTRO: Só vê suas próprias pendências se não for ADMIN
  const filteredPendencias = useMemo(() => {
    return pendenciasMock.filter(p => isAdmin || p.physioId === user.id);
  }, [isAdmin, user.id]);

  // LOGICA DE FILTRO: Só vê seu histórico se não for ADMIN
  const filteredHistory = useMemo(() => {
    return historicoMock.filter(entry => {
      const matchesSearch = entry.name.toLowerCase().includes(searchPatient.toLowerCase());
      const canSeePhysio = isAdmin ? (filterPhysio === 'Todos' || entry.physio === filterPhysio) : entry.physioId === user.id;
      return matchesSearch && canSeePhysio;
    });
  }, [isAdmin, filterPhysio, searchPatient, user.id]);

  const handleOpenEvolution = (patient: any) => {
    setSelectedPatient(patient);
    setIsEvolutionModalOpen(true);
  };

  const handleCloseEvolution = () => {
    setIsEvolutionModalOpen(false);
    setSelectedPatient(null);
  };

  const handleOpenQuickView = (entry: any) => {
    setSelectedHistoryEntry(entry);
    setIsQuickViewModalOpen(true);
  };

  const handleExportHistory = () => {
    alert("Gerando PDF consolidado dos prontuários selecionados...");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Atendimentos</h2>
          <p className="text-slate-500 text-sm font-medium">
            {isAdmin ? 'Visão global de evoluções e prontuários' : 'Gerencie suas evoluções e histórico de pacientes'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeView === 'historico' && (
            <button
              onClick={handleExportHistory}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Download size={16} /> Exportar Prontuário
            </button>
          )}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-2xl text-amber-600 text-[10px] font-black uppercase tracking-widest">
            <AlertTriangle size={16} />
            <span>{filteredPendencias.length} {isAdmin ? 'Pendências na Clínica' : 'Minhas Pendências'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-3">
          <button
            onClick={() => setActiveView('fila')}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-[24px] font-bold text-sm transition-all shadow-sm ${activeView === 'fila' ? 'bg-[var(--primary-color)] text-white shadow-cyan-100' : 'bg-white text-slate-500 hover:text-[var(--primary-color)]'
              }`}
          >
            <div className="flex items-center gap-3">
              <Clock size={20} />
              <span>{isAdmin ? 'Fila de Evolução' : 'Minha Fila'}</span>
            </div>
            {activeView === 'fila' && <ChevronRight size={18} className="opacity-50" />}
          </button>
          <button
            onClick={() => setActiveView('historico')}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-[24px] font-bold text-sm transition-all shadow-sm ${activeView === 'historico' ? 'bg-[var(--primary-color)] text-white shadow-cyan-100' : 'bg-white text-slate-500 hover:text-[var(--primary-color)]'
              }`}
          >
            <div className="flex items-center gap-3">
              <History size={20} />
              <span>{isAdmin ? 'Histórico Geral' : 'Meu Histórico'}</span>
            </div>
            {activeView === 'historico' && <ChevronRight size={18} className="opacity-50" />}
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {activeView === 'fila' ? (
            <div className="space-y-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Sessões realizadas aguardando prontuário</p>
              {filteredPendencias.length === 0 ? (
                <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100">
                  <CheckCircle2 size={48} className="text-emerald-200 mx-auto mb-4" />
                  <h4 className="font-black text-slate-800 text-lg">Prontuários em dia!</h4>
                  <p className="text-slate-400 text-sm">Não há atendimentos aguardando evolução clínica.</p>
                </div>
              ) : (
                filteredPendencias.map(p => (
                  <div key={p.id} className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-6 hover:border-[var(--primary-color)]/30 hover:shadow-xl hover:shadow-cyan-100/20 transition-all group animate-in slide-in-from-right-2 duration-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-[22px] flex items-center justify-center font-black text-slate-300 shrink-0 group-hover:bg-cyan-50 group-hover:text-[var(--primary-color)] transition-all border border-slate-100">
                      {p.name.split(' ').map((n: any) => n[0]).join('')}
                    </div>
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h4 className="font-black text-slate-800 text-xl tracking-tight truncate">{p.name}</h4>
                        <span className="text-[9px] bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-black uppercase tracking-widest border border-amber-100 w-fit mx-auto sm:mx-0">Pendente</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[11px] text-slate-400 font-bold uppercase tracking-widest justify-center sm:justify-start">
                        <span className="flex items-center gap-1.5 text-[var(--primary-color)]"><Stethoscope size={14} /> {p.service}</span>
                        <span className="flex items-center gap-1.5"><Calendar size={14} /> {p.date} • {p.time}</span>
                        {isAdmin && <span className="flex items-center gap-1.5"><UserIcon size={14} /> {p.physio}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenEvolution(p)}
                      className="flex items-center gap-2 bg-[var(--primary-color)] hover:bg-[#008c9a] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-cyan-100 shrink-0 w-full sm:w-auto justify-center active:scale-95"
                    >
                      <Edit3 size={18} />
                      <span>Evoluir</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* History Filters */}
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    placeholder="Filtrar por nome do paciente..."
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent rounded-2xl text-sm font-bold text-slate-600 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white focus:border-cyan-100 outline-none transition-all text-left"
                    value={searchPatient}
                    onChange={(e) => setSearchPatient(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative group">
                    <select
                      value={filterPeriod}
                      onChange={(e) => setFilterPeriod(e.target.value)}
                      className="appearance-none bg-slate-50 border-none pl-4 pr-10 py-3.5 rounded-2xl text-xs font-black text-slate-500 outline-none focus:ring-2 focus:ring-cyan-100 cursor-pointer min-w-[140px]"
                    >
                      <option>Este mês</option>
                      <option>Últimos 3 meses</option>
                      <option>Todo o histórico</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                  </div>

                  <div className="relative group">
                    {isAdmin ? (
                      <>
                        <select
                          value={filterPhysio}
                          onChange={(e) => setFilterPhysio(e.target.value)}
                          className="appearance-none bg-slate-50 border-none pl-4 pr-10 py-3.5 rounded-2xl text-xs font-black text-slate-500 outline-none focus:ring-2 focus:ring-cyan-100 cursor-pointer min-w-[140px]"
                        >
                          <option>Todos</option>
                          <option>Dr. Leonardo Johann</option>
                          <option>Dra. Ana Silva</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400">
                        <Lock size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{user.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TIMELINE VIEW */}
              <div className="relative pl-8 sm:pl-12 space-y-10">
                {/* Timeline vertical line */}
                <div className="absolute left-[11px] sm:left-[19px] top-4 bottom-4 w-0.5 bg-slate-100" />

                {filteredHistory.length > 0 ? (
                  filteredHistory.map((entry, idx) => (
                    <div key={entry.id} className="relative group animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                      {/* Timeline Dot */}
                      <div className="absolute -left-[30px] sm:-left-[43px] top-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-4 border-cyan-500 shadow-sm z-10 transition-transform group-hover:scale-110" />

                      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm group-hover:shadow-md transition-all text-left relative">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                          <div>
                            <p className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-[0.2em] mb-2">{entry.date} • {entry.time}</p>
                            <h4 className="text-xl font-black text-slate-800 tracking-tight">{entry.name}</h4>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{entry.service}</p>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            {isAdmin && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-5 h-5 bg-cyan-50 rounded-full flex items-center justify-center text-[8px] font-black text-cyan-600 uppercase border border-cyan-100">
                                  {entry.physio.split(' ').slice(-1)[0][0]}
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{entry.physio}</span>
                              </div>
                            )}
                            <button
                              onClick={() => handleOpenQuickView(entry)}
                              className="text-[var(--primary-color)] text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-1.5"
                            >
                              Ver Prontuário Completo <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50">
                          <p className="text-sm font-medium text-slate-600 leading-relaxed italic line-clamp-2">
                            "{entry.content}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 ml-[-20px] sm:ml-[-32px]">
                    <History size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">Nenhum histórico encontrado para os filtros selecionados.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Evolution Entry Modal */}
      {isEvolutionModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[540px] rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col text-left">
            <div className="p-8 flex items-center justify-between bg-white border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-50 text-[var(--primary-color)] rounded-2xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-xl tracking-tight">Registro de Evolução</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Anotações do Prontuário</p>
                </div>
              </div>
              <button onClick={handleCloseEvolution} className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
              <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center gap-5 shadow-inner">
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-[22px] flex items-center justify-center text-[var(--primary-color)] font-black text-xl shrink-0 shadow-sm">
                  {selectedPatient.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="space-y-1">
                  <p className="font-black text-slate-800 text-xl tracking-tight">{selectedPatient.name}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                    {selectedPatient.service} • {selectedPatient.date}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Conteúdo da Sessão *</label>
                <textarea
                  autoFocus
                  className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[32px] text-slate-700 focus:ring-8 focus:ring-cyan-500/5 focus:border-cyan-500 outline-none min-h-[220px] resize-none transition-all font-medium text-base leading-relaxed"
                  placeholder="Descreva o quadro do paciente, condutas realizadas e respostas ao tratamento..."
                />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Anexos Clínicos</label>
                <div className="border-2 border-dashed border-slate-100 rounded-[32px] p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-cyan-50/30 hover:border-cyan-200 transition-all cursor-pointer group">
                  <Upload size={32} className="text-slate-300 group-hover:text-[var(--primary-color)] mb-3 transition-colors" />
                  <p className="text-xs text-slate-400 font-black uppercase tracking-widest group-hover:text-cyan-600">Arraste exames ou fotos aqui</p>
                </div>
              </div>
            </div>
            <div className="p-10 pt-4 flex justify-end gap-4 bg-white">
              <button onClick={handleCloseEvolution} className="px-8 py-4 text-sm font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancelar</button>
              <button onClick={() => { alert("Evolução registrada com sucesso!"); handleCloseEvolution(); }} className="flex-1 bg-[var(--primary-color)] hover:bg-[#008c9a] text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-cyan-100 transition-all active:scale-95">Salvar Prontuário</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick View History Entry Modal */}
      {isQuickViewModalOpen && selectedHistoryEntry && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[540px] rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col text-left">
            <div className="p-8 flex items-center justify-between bg-white border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl">
                  <History size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-xl tracking-tight">Evolução Detalhada</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registro de {selectedHistoryEntry.date}</p>
                </div>
              </div>
              <button onClick={() => setIsQuickViewModalOpen(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
              <div className="bg-slate-50/60 p-6 rounded-[32px] border border-slate-100 flex items-center gap-5">
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-[22px] flex items-center justify-center text-slate-300 font-black text-xl shrink-0">
                  {selectedHistoryEntry.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="space-y-1">
                  <p className="font-black text-slate-800 text-xl tracking-tight">{selectedHistoryEntry.name}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                    {selectedHistoryEntry.service} • Responsável: {selectedHistoryEntry.physio}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <FileText size={14} className="text-cyan-600" /> Relatório Clínico
                </div>
                <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 italic text-slate-600 text-base leading-relaxed shadow-inner">
                  "{selectedHistoryEntry.content}"
                </div>
              </div>
            </div>
            <div className="p-10 pt-4 flex justify-end bg-white">
              <button
                onClick={() => setIsQuickViewModalOpen(false)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all active:scale-95"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
