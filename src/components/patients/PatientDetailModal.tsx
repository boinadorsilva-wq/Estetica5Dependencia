import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { User, FileText, CreditCard, Clock, Image as ImageIcon, Save, CheckCircle2 } from 'lucide-react';
import { useAppointments } from '../../hooks/useAppointments';
import { Patient } from '../../../types';

interface PatientDetailModalProps {
    patient: Patient | null;
    onClose: () => void;
}

export const PatientDetailModal = ({ patient, onClose }: PatientDetailModalProps) => {
    const [activeTab, setActiveTab] = useState<'dados' | 'prontuario' | 'assinaturas'>('dados');
    const { appointments, updateAppointmentNotes } = useAppointments();

    // Estados para edição das Notas de Evolução
    const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
    const [notesContent, setNotesContent] = useState<string>('');

    if (!patient) return null;

    const patientAppointments = appointments
        .filter(a => a.patientId === patient.id)
        .sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`).getTime();
            const dateB = new Date(`${b.date}T${b.time}`).getTime();
            return dateB - dateA;
        });

    const handleSaveNotes = async (appointmentId: string) => {
        try {
            await updateAppointmentNotes(appointmentId, notesContent);
            setEditingNotesId(null);
            // Em aplicação real, você pode notificar o sucesso em um toast
        } catch (error) {
            alert("Falha ao salvar a evolução.");
        }
    };

    const handleUploadMock = () => {
        alert("Upload de fotos (Antes/Depois) será enviado para o Supabase Storage em breve! Interface pronta.");
    };

    return (
        <Modal
            isOpen={!!patient}
            onClose={onClose}
            title={`Prontuário: ${patient.name}`}
            className="max-w-4xl h-[80vh]"
        >
            <div className="flex flex-col h-full">
                <div className="flex gap-2 border-b border-slate-100 mb-6">
                    <button
                        onClick={() => setActiveTab('dados')}
                        className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'dados' ? 'border-cyan-brand text-cyan-brand' : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <User size={16} /> Dados Pessoais
                    </button>
                    <button
                        onClick={() => setActiveTab('prontuario')}
                        className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'prontuario' ? 'border-cyan-brand text-cyan-brand' : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <FileText size={16} /> Histórico Clínico
                    </button>
                    <button
                        onClick={() => setActiveTab('assinaturas')}
                        className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'assinaturas' ? 'border-cyan-brand text-cyan-brand' : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <CreditCard size={16} /> Assinaturas e Créditos
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {activeTab === 'dados' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <label className="text-xs font-bold text-slate-400 uppercase">CPF</label>
                                    <p className="text-slate-800 font-medium">{patient.cpf}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Telefone</label>
                                    <p className="text-slate-800 font-medium">{patient.phone}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                                    <p className="text-slate-800 font-medium">{patient.email || 'Não informado'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Observações Iniciais</label>
                                    <p className="text-slate-800 font-medium">{patient.notes || 'Nenhuma observação.'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'prontuario' && (
                        <div className="space-y-4">
                            {patientAppointments.length === 0 ? (
                                <p className="text-center text-slate-400 py-8">Nenhum atendimento registrado.</p>
                            ) : (
                                patientAppointments.map(apt => {
                                    const isEditing = editingNotesId === apt.id;
                                    const canHaveEvolution = apt.status === 'REALIZADO' || apt.status === 'CONFIRMADO';

                                    return (
                                        <div key={apt.id} className="p-5 border border-slate-100 rounded-2xl hover:border-cyan-100 transition-colors shadow-sm bg-white">
                                            <div className="flex justify-between mb-3 items-start">
                                                <div>
                                                    <span className="text-cyan-brand font-bold text-sm flex items-center gap-1.5 mb-1">
                                                        <Clock size={14} />
                                                        {apt.date ? apt.date.split('-').reverse().join('/') : ''} às {apt.time}
                                                    </span>
                                                    <div className="text-xs text-slate-500 font-medium">Profissional: <span className="font-bold text-slate-700">{apt.physio}</span></div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="text-xs font-bold uppercase bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 tracking-wider">
                                                        {apt.type}
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${apt.status === 'REALIZADO' || apt.status === 'CONFIRMADO' ? 'bg-emerald-50 text-emerald-600' :
                                                        apt.status === 'CANCELADO' ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-orange-600'
                                                        }`}>
                                                        {apt.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Área de Evolução e Notas */}
                                            {canHaveEvolution && (
                                                <div className="mt-4 pt-4 border-t border-slate-50">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Notas de Evolução</p>
                                                        {!isEditing && (
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={handleUploadMock} className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 bg-cyan-50 px-2 py-1 rounded">
                                                                    <ImageIcon size={12} /> Fotos
                                                                </button>
                                                                <button
                                                                    onClick={() => { setEditingNotesId(apt.id); setNotesContent(apt.notes || ''); }}
                                                                    className="text-xs font-bold text-slate-400 hover:text-cyan-brand transition-colors"
                                                                >
                                                                    {apt.notes ? 'Editar' : 'Escrever'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {isEditing ? (
                                                        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                                            <textarea
                                                                value={notesContent}
                                                                onChange={(e) => setNotesContent(e.target.value)}
                                                                placeholder="Descreva a evolução, procedimentos aplicados, respostas do paciente, skincare recomendado..."
                                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-brand/20 min-h-[100px] resize-none"
                                                                autoFocus
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => setEditingNotesId(null)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
                                                                <button onClick={() => handleSaveNotes(apt.id)} className="px-4 py-2 text-xs font-bold text-white bg-cyan-brand hover:bg-cyan-600 rounded-lg flex items-center gap-1 shadow-sm">
                                                                    <Save size={14} /> Salvar Evolução
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className={`text-sm ${apt.notes ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                                                            {apt.notes || 'Nenhuma evolução registrada para esta sessão.'}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}

                    {activeTab === 'assinaturas' && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg shadow-cyan-500/20">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg">Pacote de Pilates</h3>
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">Ativo</span>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-black">5</span>
                                    <span className="text-sm font-medium opacity-80 mb-1">créditos restantes</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-800 mb-3">Histórico de Uso</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between p-3 bg-slate-50 rounded-xl text-sm">
                                        <span className="text-slate-600">Aula de Pilates</span>
                                        <span className="text-red-500 font-bold">-1 crédito</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-slate-50 rounded-xl text-sm">
                                        <span className="text-slate-600">Compra de Pacote (10 aulas)</span>
                                        <span className="text-green-600 font-bold">+10 créditos</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
