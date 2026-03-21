
import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  ChevronRight,
  Users,
  ChevronDown,
  ArrowUpDown,
  Phone,
  Calendar,
  User as UserIcon,
  X,
  Cake,
  FileText,
  Check,
  Stethoscope,
  MapPin,
  CreditCard,
  Hash,
  Settings
} from 'lucide-react';
import { User as UserType, UserRole, CID10 } from '../../types';
import { CID10_MOCK, USERS_MOCK } from '../../constants';
import { usePatients } from '../../src/hooks/usePatients';
import { supabase } from '../../src/lib/supabase';

interface PatientsProps {
  onSelectPatient: (id: string) => void;
  user: UserType;
}

type SortOption = 'name' | 'birthDate' | 'createdAt';

export const Patients: React.FC<PatientsProps> = ({ onSelectPatient, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Estados de Filtro
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterGender, setFilterGender] = useState('Todos');
  const [filterInsurance, setFilterInsurance] = useState('Todos');
  const [filterBirthday, setFilterBirthday] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Estado do Formulário de Novo Paciente
  const [newPatient, setNewPatient] = useState({
    name: '',
    cpf: '',
    birthDate: '',
    phone: '',
    address: '',
    gender: 'Masculino',
    insurance: 'Nenhuma',
    cid10: '',
    physioId: user.role.startsWith('ESTETICISTA') ? user.id : '',
    notes: ''
  });

  // Estado da Busca de CID-10 no Form
  const [cidSearch, setCidSearch] = useState('');
  const [showCidResults, setShowCidResults] = useState(false);
  const cidFiltered = useMemo(() => {
    if (!cidSearch) return [];
    return CID10_MOCK.filter(c =>
      c.code.toLowerCase().includes(cidSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(cidSearch.toLowerCase())
    ).slice(0, 5);
  }, [cidSearch]);

  const { patients: patientsRaw, loading } = usePatients();

  const processedPatients = useMemo(() => {
    let result = [...patientsRaw];
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(lowerTerm) ||
        p.phone.includes(lowerTerm) ||
        p.insurance.toLowerCase().includes(lowerTerm)
      );
    }
    if (filterStatus !== 'Todos') result = result.filter(p => p.status === filterStatus);
    if (filterGender !== 'Todos') result = result.filter(p => p.gender === filterGender);
    if (filterInsurance !== 'Todos') result = result.filter(p => p.insurance === filterInsurance);
    if (filterBirthday) {
      const currentMonth = new Date().getMonth() + 1;
      result = result.filter(p => {
        const birthMonth = parseInt(p.birthDate.split('-')[1]);
        return birthMonth === currentMonth;
      });
    }
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      if (sortBy === 'birthDate') comparison = a.birthDate.localeCompare(b.birthDate);
      if (sortBy === 'createdAt') comparison = a.createdAt.localeCompare(b.createdAt);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [patientsRaw, user.id, user.role, searchTerm, filterStatus, filterGender, filterInsurance, filterBirthday, sortBy, sortOrder]);

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setFilterStatus('Todos');
    setFilterGender('Todos');
    setFilterInsurance('Todos');
    setFilterBirthday(false);
    setSearchTerm('');
  };

  const handleSavePatient = async () => {
    try {
      const { error } = await supabase.from('patients').insert({
        name: newPatient.name,
        cpf: newPatient.cpf,
        birthDate: newPatient.birthDate,
        phone: newPatient.phone,
        address: newPatient.address,
        gender: newPatient.gender,
        insurance: newPatient.insurance,
        cidCode: newPatient.cid10,
        responsiblePhysioId: newPatient.physioId,
        notes: newPatient.notes,
        status: 'Ativo'
      });

      if (error) throw error;

      alert("Paciente cadastrado com sucesso!");
      setIsNewModalOpen(false);
      setNewPatient({
        name: '', cpf: '', birthDate: '', phone: '', address: '',
        gender: 'Masculino', insurance: 'Nenhuma', cid10: '',
        physioId: user.role.startsWith('ESTETICISTA') ? user.id : '',
        notes: ''
      });
      setCidSearch('');
    } catch (err: any) {
      console.error(err);
      alert("Erro ao cadastrar paciente: " + err.message);
    }
  };

  const formatCPF = (val: string) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return v;
  };

  const formatPhone = (val: string) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d)(\d{4})$/, '$1-$2');
    return v;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Pacientes</h2>
          <p className="text-gray-500 text-sm font-medium">
            {user.role === UserRole.ADMIN ? 'Gestão global da base de pacientes' : 'Lista de pacientes sob seu cuidado'}
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--primary-color)] hover:bg-[#008c9a] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-cyan-100 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Novo Paciente</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou alergias..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-[20px] text-sm font-bold text-gray-600 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white focus:border-cyan-100 outline-none transition-all text-left"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-[20px] text-sm font-black transition-all border ${isFilterOpen ? 'bg-cyan-50 border-cyan-200 text-[var(--primary-color)]' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                }`}
            >
              <Filter size={18} />
              <span>Filtros</span>
            </button>

            <button
              onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-[20px] text-sm font-black transition-all border ${isSortOpen ? 'bg-cyan-50 border-cyan-200 text-[var(--primary-color)]' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                }`}
            >
              <ArrowUpDown size={18} />
              <span>Ordenar</span>
            </button>
          </div>
        </div>

        {/* Painéis de Filtro/Ordenação Omitidos para concisão, mas mantidos na lógica */}
        {isFilterOpen && (
          <div className="mt-6 pt-6 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl text-xs font-black text-gray-600 outline-none focus:ring-2 focus:ring-cyan-100">
                <option>Todos</option><option value="Em Tratamento">Em Tratamento</option><option value="Alta">Alta</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sexo</label>
              <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl text-xs font-black text-gray-600 outline-none focus:ring-2 focus:ring-cyan-100">
                <option>Todos</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option><option value="Outro">Outro</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aniversariantes</label>
              <button onClick={() => setFilterBirthday(!filterBirthday)} className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-black transition-all ${filterBirthday ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
                <span className="flex items-center gap-2"><Cake size={16} /> Este Mês</span>
                {filterBirthday && <X size={14} />}
              </button>
            </div>
            <div className="flex items-end">
              <button onClick={clearFilters} className="w-full p-3 text-xs font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest">Limpar Todos</button>
            </div>
          </div>
        )}

        {isSortOpen && (
          <div className="mt-6 pt-6 border-t border-gray-50 flex flex-wrap gap-3 animate-in slide-in-from-top-2 duration-300">
            {[
              { id: 'name', label: 'Nome (A-Z)', icon: <UserIcon size={14} /> },
              { id: 'birthDate', label: 'Data de Nascimento', icon: <Calendar size={14} /> },
              { id: 'createdAt', label: 'Data de Cadastro', icon: <Plus size={14} /> },
            ].map((opt) => (
              <button key={opt.id} onClick={() => toggleSort(opt.id as SortOption)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${sortBy === opt.id ? 'bg-[var(--primary-color)] text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                {opt.icon} {opt.label}
                {sortBy === opt.id && (sortOrder === 'asc' ? <ChevronDown className="rotate-180" size={14} /> : <ChevronDown size={14} />)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Pacientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {processedPatients.length > 0 ? (
          processedPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className="group bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 hover:border-cyan-200 transition-all cursor-pointer flex flex-col gap-6"
            >
              <div className="flex items-start justify-between">
                <div className="w-16 h-16 bg-gray-50 rounded-[22px] flex items-center justify-center text-gray-300 font-black text-xl group-hover:bg-cyan-50 group-hover:text-[var(--primary-color)] transition-all border border-gray-100">
                  {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${patient.status === 'Em Tratamento' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                    {patient.status}
                  </span>
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Desde {new Date(patient.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-800 group-hover:text-cyan-900 transition-colors truncate">{patient.name}</h3>
                <p className="text-xs font-bold text-gray-400 flex items-center gap-2"><Phone size={14} className="text-gray-200" /> {patient.phone}</p>
              </div>
              <div className="pt-6 border-t border-gray-50 flex items-center justify-end">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:bg-[var(--primary-color)] group-hover:text-white transition-all">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          ))
        ) : loading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-6 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 bg-gray-100 rounded-[22px]"></div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="w-20 h-5 bg-gray-100 rounded-full"></div>
                    <div className="w-24 h-3 bg-gray-100 rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-3/4 h-6 bg-gray-100 rounded-md"></div>
                  <div className="w-1/2 h-4 bg-gray-100 rounded-md"></div>
                </div>
                <div className="pt-6 border-t border-gray-50 flex items-center justify-end">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl"></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
            <Users size={48} className="text-gray-200 mb-6" />
            <h4 className="text-2xl font-black text-gray-800">Nenhum paciente encontrado</h4>
          </div>
        )}
      </div>

      {/* MODAL NOVO PACIENTE */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[800px] max-h-[90vh] rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-8 flex items-center justify-between bg-white border-b border-gray-50">
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-cyan-50 text-[var(--primary-color)] rounded-2xl">
                  <Plus size={24} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-2xl tracking-tight">Novo Paciente</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cadastro Clínico Completo</p>
                </div>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"><X size={24} /></button>
            </div>

            <div className="p-10 space-y-10 overflow-y-auto text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Nome e CPF */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo *</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input
                        type="text"
                        value={newPatient.name}
                        onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none"
                        placeholder="Ex: João da Silva"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">CPF *</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input
                        type="text"
                        value={newPatient.cpf}
                        onChange={(e) => setNewPatient({ ...newPatient, cpf: formatCPF(e.target.value) })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none"
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                </div>

                {/* Nascimento e Telefone */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento *</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input
                        type="date"
                        value={newPatient.birthDate}
                        onChange={(e) => setNewPatient({ ...newPatient, birthDate: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Telefone *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input
                        type="text"
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient({ ...newPatient, phone: formatPhone(e.target.value) })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                    type="text"
                    value={newPatient.address}
                    onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none"
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sexo e Alergias */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Gênero *</label>
                    <select
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-4 focus:ring-cyan-500/5 outline-none appearance-none"
                    >
                      <option>Masculino</option><option>Feminino</option><option>Outro</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Alergias</label>
                    <select
                      value={newPatient.insurance}
                      onChange={(e) => setNewPatient({ ...newPatient, insurance: e.target.value })}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-4 focus:ring-cyan-500/5 outline-none appearance-none"
                    >
                      <option>Nenhuma</option><option>Cosméticos</option><option>Medicamentos</option><option>Látex / Borracha</option><option>Outras</option>
                    </select>
                  </div>
                </div>

                {/* Fototipo */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Fototipo (Fitzpatrick)</label>
                  <div className="relative">
                    <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <select
                      value={newPatient.cid10}
                      onChange={(e) => setNewPatient({ ...newPatient, cid10: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-4 focus:ring-cyan-500/5 outline-none appearance-none"
                    >
                      <option value="">Selecione o fototipo...</option>
                      <option value="I - Branca (Sempre queima)">I - Pele muito clara (Sempre queima)</option>
                      <option value="II - Branca (Queima fácil)">II - Pele clara (Queima fácil)</option>
                      <option value="III - Morena clara">III - Morena clara (Queima moderadamente)</option>
                      <option value="IV - Morena moderada">IV - Morena moderada (Queima pouco)</option>
                      <option value="V - Morena escura">V - Morena escura (Raramente queima)</option>
                      <option value="VI - Negra">VI - Negra (Nunca queima)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Profissional Responsável */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Profissional Responsável *</label>
                <div className="relative">
                  <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <select
                    value={newPatient.physioId}
                    onChange={(e) => setNewPatient({ ...newPatient, physioId: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-4 focus:ring-cyan-500/5 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Selecione o profissional...</option>
                    {USERS_MOCK.filter(u => u.role !== UserRole.PENDENTE).map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Observações Iniciais</label>
                <textarea
                  value={newPatient.notes}
                  onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })}
                  className="w-full p-6 bg-gray-50 border-none rounded-[32px] text-sm font-medium text-gray-700 focus:ring-4 focus:ring-cyan-500/5 focus:bg-white outline-none min-h-[120px] resize-none"
                  placeholder="Relatos do paciente, encaminhamentos ou cuidados especiais..."
                />
              </div>
            </div>

            <div className="p-8 bg-white border-t border-gray-50 flex items-center justify-end gap-4">
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="px-8 py-4 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePatient}
                disabled={!newPatient.name || !newPatient.cpf || !newPatient.physioId}
                className="flex-1 max-w-[280px] bg-[var(--primary-color)] hover:bg-[#008c9a] disabled:bg-gray-200 disabled:text-gray-400 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-cyan-100 transition-all active:scale-95"
              >
                Cadastrar Paciente
              </button>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};