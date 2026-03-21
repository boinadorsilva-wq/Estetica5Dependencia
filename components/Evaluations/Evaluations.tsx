
import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  User as UserIcon,
  Activity,
  ChevronRight,
  FileText,
  UserCheck,
  Stethoscope,
  Info
} from 'lucide-react';
import { User, UserRole, ClinicalEvaluation } from '../../types';

interface EvaluationsProps {
  user: User;
  onNavigateToPatient?: (id: string) => void;
}

const BODY_PARTS = [
  { id: 'head', name: 'Cabeça', x: '50%', y: '10%' },
  { id: 'neck', name: 'Pescoço', x: '50%', y: '16%' },
  { id: 'upper_back', name: 'Coluna Torácica', x: '50%', y: '25%' },
  { id: 'lower_back', name: 'Coluna Lombar', x: '50%', y: '35%' },
  { id: 'right_shoulder', name: 'Ombro Direito', x: '35%', y: '20%' },
  { id: 'left_shoulder', name: 'Ombro Esquerdo', x: '65%', y: '20%' },
  { id: 'right_knee', name: 'Joelho Direito', x: '42%', y: '75%' },
  { id: 'left_knee', name: 'Joelho Esquerdo', x: '58%', y: '75%' },
];

export const Evaluations: React.FC<EvaluationsProps> = ({ user, onNavigateToPatient }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = user.role === UserRole.ADMIN;

  const [newEval, setNewEval] = useState<Partial<ClinicalEvaluation>>({
    anamnese: { queixaPrincipal: '', hda: '', historicoFamiliar: '' },
    mapaDor: [],
    escalas: { eva: 0 }
  });

  const evaluationsMock: any[] = [];

  const filteredEvals = useMemo(() => {
    return evaluationsMock.filter(e =>
      (isAdmin || e.physioId === user.id) &&
      e.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, isAdmin, user.id]);

  const toggleBodyPart = (id: string) => {
    setNewEval(prev => {
      const currentMap = prev.mapaDor || [];
      const newMap = currentMap.includes(id)
        ? currentMap.filter(p => p !== id)
        : [...currentMap, id];
      return { ...prev, mapaDor: newMap };
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Avaliações Clínicas</h2>
          <p className="text-slate-500 text-sm font-medium">Realize diagnósticos e acompanhe a evolução estrutural dos pacientes</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--primary-color)] hover:bg-[#008c9a] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-cyan-100 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Nova Avaliação</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome do paciente..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-sm font-bold text-slate-600 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvals.map(ev => (
          <div key={ev.id} className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all group flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 font-black group-hover:bg-cyan-50 group-hover:text-[var(--primary-color)] transition-all">
                <FileText size={24} />
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{ev.date}</span>
            </div>
            <h4 className="font-black text-slate-800 text-xl mb-1 truncate">{ev.patientName}</h4>
            <p className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-widest mb-4">{ev.physio}</p>
            <p className="text-sm font-medium text-slate-500 line-clamp-2 bg-slate-50 p-4 rounded-2xl mb-6">
              "{ev.queixa}"
            </p>
            <button
              onClick={() => {
                if (onNavigateToPatient) {
                  // Fake ID para simular navegação, como as evals ainda usam mock
                  // No futuro 'ev.patientId' deveria ser o ID real do banco
                  onNavigateToPatient(ev.patientId || '1');
                }
              }}
              className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-cyan-50 hover:text-[var(--primary-color)] hover:border-cyan-100 transition-all"
            >
              Acessar Prontuário <ChevronRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* MODAL NOVA AVALIAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 text-left">
          <div className="bg-white w-full max-w-[900px] max-h-[90vh] rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-8 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-50 text-[var(--primary-color)] rounded-2xl">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-xl tracking-tight">Nova Avaliação Inicial</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Diagnóstico Estético</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"><X size={24} /></button>
            </div>

            <div className="p-10 overflow-y-auto space-y-12 bg-slate-50/30">
              {/* Seção 1: Anamnese */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="text-[var(--primary-color)]" size={20} />
                  <h5 className="font-black text-slate-800 uppercase text-xs tracking-widest">Anamnese do Paciente</h5>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Queixa Principal *</label>
                    <textarea
                      className="w-full p-5 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none min-h-[80px] transition-all"
                      placeholder="Relate o motivo principal da busca pelo tratamento..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">HDA (História da Doença Atual)</label>
                      <textarea className="w-full p-5 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none min-h-[100px] transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Histórico Familiar / Pregresso</label>
                      <textarea className="w-full p-5 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none min-h-[100px] transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 2: Mapa da Dor & Escalas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Mapa da Dor */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-8">
                    <UserIcon className="text-[var(--primary-color)]" size={20} />
                    <h5 className="font-black text-slate-800 uppercase text-xs tracking-widest">Mapa da Dor (Click para Marcar)</h5>
                  </div>
                  <div className="relative flex-1 bg-slate-50 rounded-3xl p-4 flex items-center justify-center min-h-[400px]">
                    {/* SVG HUMAN SILHOUETTE SCHEMATIC */}
                    <svg viewBox="0 0 100 140" className="w-48 h-full opacity-20 text-slate-900">
                      <path fill="currentColor" d="M50 5c-3 0-6 3-6 7s3 7 6 7 6-3 6-7-3-7-6-7zm-4 15c-10 0-14 4-14 14v25l-4 35c-1 3 2 5 4 4l5-25 1 25c0 3 4 3 4 0v-25h4v25c0 3 4 3 4 0v-25l1 25c2 1 5-1 4-4l-4-35V34c0-10-4-14-14-14z" />
                    </svg>
                    {/* Points on Top */}
                    {BODY_PARTS.map(part => (
                      <button
                        key={part.id}
                        onClick={() => toggleBodyPart(part.id)}
                        className={`absolute w-6 h-6 rounded-full border-2 transition-all transform hover:scale-125 flex items-center justify-center text-[8px] font-bold
                          ${newEval.mapaDor?.includes(part.id)
                            ? 'bg-[var(--primary-color)] border-white text-white shadow-lg shadow-cyan-200'
                            : 'bg-white border-slate-200 text-slate-400'}`}
                        style={{ left: part.x, top: part.y, translate: '-50% -50%' }}
                        title={part.name}
                      >
                        {newEval.mapaDor?.includes(part.id) ? '!' : ''}
                      </button>
                    ))}
                    <div className="absolute bottom-4 left-4 right-4 text-[9px] font-bold text-slate-400 uppercase text-center">
                      Toque nas zonas vermelhas para indicar focos de dor
                    </div>
                  </div>
                </div>

                {/* Escalas */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col space-y-8">
                  <div className="flex items-center gap-3">
                    <Activity className="text-[var(--primary-color)]" size={20} />
                    <h5 className="font-black text-slate-800 uppercase text-xs tracking-widest">Escalas de Medição</h5>
                  </div>

                  {/* EVA */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escala de Dor (EVA)</label>
                      <span className="text-2xl font-black text-[var(--primary-color)]">{newEval.escalas?.eva}</span>
                    </div>
                    <div className="px-2">
                      <input
                        type="range" min="0" max="10" step="1"
                        value={newEval.escalas?.eva}
                        onChange={(e) => setNewEval({ ...newEval, escalas: { ...newEval.escalas!, eva: parseInt(e.target.value) } })}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[var(--primary-color)]"
                      />
                      <div className="flex justify-between mt-2 px-1">
                        <span className="text-[8px] font-black text-slate-300">SEM DOR</span>
                        <span className="text-[8px] font-black text-slate-300">DOR EXTREMA</span>
                      </div>
                    </div>
                  </div>

                  {/* ADM */}
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Amplitude de Movimento (ADM)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 ml-1">Articulação</p>
                        <input type="text" placeholder="Ex: Joelho Dir." className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 ml-1">Graus (°)</p>
                        <div className="relative">
                          <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none" defaultValue="0" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-300">°</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-[9px] font-black text-[var(--primary-color)] uppercase tracking-widest flex items-center gap-1.5 hover:underline">
                      <Plus size={14} /> Adicionar Nova Medição
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 pt-4 flex items-center justify-end gap-4 bg-white border-t border-slate-50">
              <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancelar</button>
              <button onClick={() => { alert("Avaliação registrada!"); setIsModalOpen(false); }} className="flex-1 bg-[var(--primary-color)] hover:bg-[#008c9a] text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-cyan-100 transition-all active:scale-95">Finalizar Avaliação</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
