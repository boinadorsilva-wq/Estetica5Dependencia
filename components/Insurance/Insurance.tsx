
import React, { useState } from 'react';
import {
  Building,
  Plus,
  Search,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Ban,
  Filter,
  FileText,
  DollarSign,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { User, GuideStatus } from '../../types';

interface InsuranceProps {
  user: User;
}

export const Insurance: React.FC<InsuranceProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<GuideStatus | 'Todos'>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const providersMock = [
    { id: '1', name: 'Unimed Porto Alegre', code: '001234', activeGuides: 12, glosadas: 1 },
    { id: '2', name: 'Bradesco Saúde', code: '456789', activeGuides: 8, glosadas: 0 },
    { id: '3', name: 'Cassi', code: '321654', activeGuides: 5, glosadas: 2 },
  ];

  const guidesMock: any[] = [];

  const getStatusColor = (status: GuideStatus) => {
    switch (status) {
      case GuideStatus.AUTORIZADA: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case GuideStatus.PENDENTE: return 'bg-amber-50 text-amber-600 border-amber-100';
      case GuideStatus.GLOSADA: return 'bg-rose-50 text-rose-600 border-rose-100';
      case GuideStatus.PAGA: return 'bg-cyan-50 text-cyan-600 border-cyan-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  const getStatusIcon = (status: GuideStatus) => {
    switch (status) {
      case GuideStatus.AUTORIZADA: return <CheckCircle2 size={14} />;
      case GuideStatus.PENDENTE: return <AlertCircle size={14} />;
      case GuideStatus.GLOSADA: return <Ban size={14} />;
      case GuideStatus.PAGA: return <DollarSign size={14} />;
      default: return null;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Convênios</h2>
          <p className="text-slate-500 text-sm font-medium">Controle de faturamento TISS, autorizações e glosas de operadoras</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--primary-color)] hover:bg-[#008c9a] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-cyan-100 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Nova Guia / Faturamento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Operadoras Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Operadoras Cadastradas</h3>
            <div className="space-y-3">
              {providersMock.map(p => (
                <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-cyan-100 hover:bg-white transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-slate-800 text-xs tracking-tight">{p.name}</span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-[var(--primary-color)]" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Guias: {p.activeGuides}</span>
                    {p.glosadas > 0 && <span className="text-[8px] font-black text-rose-500 uppercase">Glosas: {p.glosadas}</span>}
                  </div>
                </div>
              ))}
              <button className="w-full py-3 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <Plus size={14} /> Adicionar Convênio
              </button>
            </div>
          </div>
        </div>

        {/* Guias Faturamento */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" placeholder="Buscar por número da guia ou paciente..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 outline-none" />
            </div>
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
              {['Todos', GuideStatus.AUTORIZADA, GuideStatus.PENDENTE, GuideStatus.GLOSADA].map(status => (
                <button
                  key={status}
                  onClick={() => setActiveTab(status as any)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === status ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Paciente / Guia</th>
                  <th className="px-8 py-5">Convênio</th>
                  <th className="px-8 py-5">Sessões</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {guidesMock.filter(g => activeTab === 'Todos' || g.status === activeTab).map(guide => (
                  <tr key={guide.id} className="group hover:bg-slate-50/30 transition-all">
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-slate-800 mb-1">{guide.patient}</div>
                      <div className="text-[10px] font-bold text-slate-400">Nº {guide.number}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{guide.provider}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--primary-color)]" style={{ width: `${(parseInt(guide.sessions.split('/')[0]) / parseInt(guide.sessions.split('/')[1])) * 100}%` }}></div>
                        </div>
                        <span className="text-xs font-black text-slate-700">{guide.sessions}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit ${getStatusColor(guide.status)}`}>
                        {getStatusIcon(guide.status)} {guide.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-slate-300 hover:text-[var(--primary-color)] hover:bg-cyan-50 rounded-xl transition-all">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL NOVA GUIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[480px] rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col text-left">
            <div className="p-8 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-50 text-[var(--primary-color)] rounded-2xl">
                  <FileText size={24} />
                </div>
                <h3 className="font-black text-slate-800 text-xl tracking-tight">Faturar Guia Convênio</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paciente *</label>
                <div className="relative">
                  <select className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 outline-none appearance-none">
                    <option>Selecione o paciente...</option>
                    <option>Binho Johann</option>
                    <option>Maria Souza</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nº da Guia *</label>
                  <input type="text" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" placeholder="Ex: 998877" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sessões Autorizadas</label>
                  <input type="number" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" defaultValue="10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Validade da Guia</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="date" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" />
                </div>
              </div>
            </div>
            <div className="p-8 pt-2 flex items-center justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-4 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancelar</button>
              <button onClick={() => { alert("Guia cadastrada e pronta para faturamento TISS!"); setIsModalOpen(false); }} className="flex-1 bg-[var(--primary-color)] hover:bg-[#008c9a] text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-cyan-100 transition-all active:scale-95">Cadastrar Guia</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
