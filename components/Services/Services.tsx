
import React, { useState } from 'react';
import {
  Stethoscope,
  Plus,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Package,
  FileText,
  Users,
  RotateCcw,
  X,
  Lock,
  Info,
  ChevronDown
} from 'lucide-react';
import { Service, User, UserRole } from '../../types';
import { useServices } from '../../src/hooks/useServices';

interface ServicesProps {
  user: User;
}

export const Services: React.FC<ServicesProps> = ({ user }) => {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const isAdmin = user.role === UserRole.ADMIN;

  const [serviceForm, setServiceForm] = useState({
    name: '',
    duration: '60',
    value: '150.00',
    type: 'Individual'
  });

  const { services, addService, updateService, deleteService, loading } = useServices();

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setServiceForm({
      name: service.name,
      duration: service.duration.toString(),
      value: service.value.toString(),
      type: service.type
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = async () => {
    if (!serviceForm.name || !serviceForm.duration || !serviceForm.value) return;
    try {
      await addService({
        name: serviceForm.name,
        duration: Number(serviceForm.duration),
        value: Number(serviceForm.value),
        type: serviceForm.type as any
      });
      setIsNewModalOpen(false);
      setServiceForm({ name: '', duration: '60', value: '150.00', type: 'Individual' });
    } catch (err) {
      alert("Erro ao adicionar serviço.");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedService || !serviceForm.name || !serviceForm.duration || !serviceForm.value) return;
    try {
      await updateService(selectedService.id, {
        name: serviceForm.name,
        duration: Number(serviceForm.duration),
        value: Number(serviceForm.value),
        type: serviceForm.type as any
      });
      setIsEditModalOpen(false);
    } catch (err) {
      alert("Erro ao salvar serviço.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este serviço?")) {
      try {
        await deleteService(id);
      } catch {
        alert("Erro ao remover");
      }
    }
  };

  const stats = [
    { label: 'Individual', count: services.filter(s => s.type === 'Individual').length, icon: <Users size={18} /> },
    { label: 'Pacotes', count: services.filter(s => s.type === 'Pacote').length, icon: <Package size={18} /> },
    { label: 'Assinaturas', count: services.filter(s => s.type === 'Assinatura').length, icon: <RotateCcw size={18} /> },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            {isAdmin ? 'Serviços da Clínica' : 'Meus Serviços'}
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            {isAdmin ? 'Gerencie as modalidades e preços da clínica' : 'Modalidades de atendimento disponíveis'}
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--primary-color)] hover:bg-[#008c9a] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-cyan-100 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-8 mb-8 px-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-3 text-slate-400 font-medium shrink-0">
            <span className="text-slate-300">{stat.icon}</span>
            <span className="text-sm font-bold">{stat.label}: <span className="text-slate-800">{stat.count}</span></span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-500 col-span-3 text-center py-10">Carregando serviços...</p>
        ) : services.length === 0 ? (
          <p className="text-slate-500 col-span-3 text-center py-10">Nenhum serviço cadastrado.</p>
        ) : services.map((service) => (
          <div key={service.id} className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm hover:border-[var(--primary-color)]/30 hover:shadow-xl hover:shadow-cyan-500/5 transition-all flex flex-col group">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center 
                ${service.type === 'Individual' ? 'bg-sky-50 text-sky-600' : ''}
                ${service.type === 'Assinatura' ? 'bg-cyan-50 text-[var(--primary-color)]' : ''}
                ${service.type === 'Pacote' ? 'bg-amber-50 text-amber-600' : ''}
              `}>
                {service.type === 'Individual' && <Stethoscope size={28} />}
                {service.type === 'Assinatura' && <FileText size={28} />}
                {service.type === 'Pacote' && <Package size={28} />}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(service)}
                  className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-[var(--primary-color)] rounded-xl transition-all"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-800 mb-1 group-hover:text-[var(--primary-color)] transition-colors">{service.name}</h3>
              <p className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-[0.2em]">{service.type}</p>
            </div>

            <div className="mt-auto space-y-4 pt-6 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  <Clock size={16} className="text-slate-300" />
                  <span>Duração</span>
                </div>
                <span className="font-black text-slate-700 text-sm">{service.duration} min</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  <DollarSign size={16} className="text-slate-300" />
                  <span>Valor</span>
                </div>
                <span className="font-black text-[var(--primary-color)] text-lg tracking-tight">R$ {service.value.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Novo Serviço */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[440px] rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col text-left">
            <div className="p-8 flex items-center justify-between bg-white border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-50 text-[var(--primary-color)] rounded-xl">
                  <Plus size={20} strokeWidth={3} />
                </div>
                <h3 className="font-black text-slate-800 text-lg">Novo Serviço</h3>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do serviço *</label>
                <div className="relative">
                  <input type="text" value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white focus:border-cyan-100 outline-none transition-all placeholder:text-slate-300" placeholder="Ex: Limpeza de Pele Profunda" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duração (min) *</label>
                  <input type="number" value={serviceForm.duration} onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$) *</label>
                  <input type="number" value={serviceForm.value} onChange={e => setServiceForm({ ...serviceForm, value: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modalidade</label>
                <div className="relative">
                  <select
                    value={serviceForm.type}
                    onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none appearance-none cursor-pointer transition-all"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Pacote">Pacote</option>
                    <option value="Assinatura">Assinatura</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>
            <div className="p-8 pt-2 flex items-center justify-end gap-3 bg-white">
              <button onClick={() => setIsNewModalOpen(false)} className="px-6 py-4 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancelar</button>
              <button onClick={handleSaveAdd} className="flex-1 bg-[var(--primary-color)] hover:bg-[#008c9a] text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-cyan-100 transition-all active:scale-95">Cadastrar Serviço</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Serviço */}
      {isEditModalOpen && selectedService && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[440px] rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col text-left">
            <div className="p-8 flex items-center justify-between bg-white border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-50 text-[var(--primary-color)] rounded-xl">
                  <Edit size={18} />
                </div>
                <h3 className="font-black text-slate-800 text-lg">Editar Serviço</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do serviço *</label>
                <div className="relative">
                  <input type="text" value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duração (min) *</label>
                  <input type="number" value={serviceForm.duration} onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$) *</label>
                  <input type="number" value={serviceForm.value} onChange={e => setServiceForm({ ...serviceForm, value: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modalidade</label>
                <div className="relative">
                  <select value={serviceForm.type} onChange={e => setServiceForm({ ...serviceForm, type: e.target.value as any })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none appearance-none cursor-pointer transition-all">
                    <option>Individual</option><option>Pacote</option><option>Assinatura</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>
            <div className="p-8 pt-2 flex items-center justify-end gap-3 bg-white">
              <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-4 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Fechar</button>
              <button onClick={handleSaveEdit} className="flex-1 bg-[var(--primary-color)] hover:bg-[#008c9a] text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-cyan-100 transition-all active:scale-95">Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
