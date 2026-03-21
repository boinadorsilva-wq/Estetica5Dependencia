import React, { useState } from 'react';
import { usePatients } from '../hooks/usePatients';
import { supabase } from '../lib/supabase';
import { Patient } from '../../types';
import { Search, Plus, User, Phone, FileText, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Link } from 'react-router-dom';
import { PatientDetailModal } from '../components/patients/PatientDetailModal';

export const Patients = () => {
    const { patients } = usePatients();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [newPatient, setNewPatient] = useState({
        name: '',
        phone: '',
        cpf: '',
        email: '',
        notes: ''
    });

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cpf.includes(searchTerm)
    );

    const handleAddPatient = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { error } = await supabase.from('patients').insert([{
                name: newPatient.name,
                phone: newPatient.phone,
                cpf: newPatient.cpf,
                email: newPatient.email,
                notes: newPatient.notes,
                status: 'Ativo',
                role: 'PACIENTE'
            }]);

            if (error) throw error;

            setIsModalOpen(false);
            setNewPatient({ name: '', phone: '', cpf: '', email: '', notes: '' });
        } catch (err) {
            console.error('Erro ao adicionar paciente:', err);
            alert('Não foi possível salvar o paciente. Verifique os dados.');
        }
    };

    // Mask util
    const maskPhone = (v: string) => {
        v = v.replace(/\D/g, "");
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d)(\d{4})$/, "$1-$2");
        return v;
    };

    const maskCPF = (v: string) => {
        v = v.replace(/\D/g, "");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        return v;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pacientes</h1>
                    <p className="text-slate-500 font-medium">Gerencie os prontuários e dados cadastrais.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2" size={20} />
                    Novo Paciente
                </Button>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-brand/20 focus:border-cyan-brand transition-all font-medium"
                    />
                </div>

                <div className="space-y-2">
                    {filteredPatients.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-3">
                                <User size={32} />
                            </div>
                            <p className="text-slate-500 font-medium">Nenhum paciente encontrado.</p>
                        </div>
                    ) : (
                        filteredPatients.map((patient) => (
                            <div
                                key={patient.id}
                                onClick={() => setSelectedPatient(patient)}
                                className="group flex items-center justify-between p-4 rounded-2xl hover:bg-cyan-50 border border-transparent hover:border-cyan-100 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-lg group-hover:bg-white group-hover:text-cyan-brand transition-colors">
                                        {patient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-cyan-brand transition-colors">{patient.name}</h3>
                                        <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
                                            <span className="flex items-center gap-1"><User size={14} /> {patient.cpf}</span>
                                            <span className="flex items-center gap-1"><Phone size={14} /> {patient.phone}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="hidden group-hover:flex items-center gap-2 px-4 py-2 bg-white text-cyan-brand font-bold rounded-xl text-sm shadow-sm opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <FileText size={16} /> Prontuário
                                    </button>
                                    <ChevronRight className="text-slate-300 group-hover:text-cyan-brand transition-colors" size={20} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Cadastrar Paciente"
            >
                <form onSubmit={handleAddPatient} className="space-y-4">
                    <Input
                        label="Nome Completo"
                        placeholder="Ex: João da Silva"
                        value={newPatient.name}
                        onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="CPF"
                            placeholder="000.000.000-00"
                            value={newPatient.cpf}
                            onChange={(e) => setNewPatient({ ...newPatient, cpf: maskCPF(e.target.value) })}
                            required
                            maxLength={14}
                        />
                        <Input
                            label="Telefone"
                            placeholder="(00) 00000-0000"
                            value={newPatient.phone}
                            onChange={(e) => setNewPatient({ ...newPatient, phone: maskPhone(e.target.value) })}
                            required
                            maxLength={15}
                        />
                    </div>

                    <Input
                        label="E-mail (Opcional)"
                        type="email"
                        placeholder="joao@exemplo.com"
                        value={newPatient.email}
                        onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    />

                    <Input
                        label="Observações Iniciais"
                        placeholder="Histórico breve..."
                        value={newPatient.notes}
                        onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })}
                    />

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                            Cadastrar
                        </Button>
                    </div>
                </form>
            </Modal>

            <PatientDetailModal
                patient={selectedPatient}
                onClose={() => setSelectedPatient(null)}
                // @ts-ignore
                onSave={(updatedPatient: Patient) => setSelectedPatient(updatedPatient)}
            />
        </div>
    );
};
