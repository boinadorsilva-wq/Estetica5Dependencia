import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Clock, CheckCircle2, FileText, ChevronRight, Activity } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Atendimentos = () => {
    const { appointments, patients, updateAppointmentStatus } = useStore();
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [evolution, setEvolution] = useState('');

    // Filter confirm appointments for today
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const queue = appointments
        .filter(apt =>
            apt.date === todayStr &&
            (apt.status === 'confirmed' || apt.status === 'completed')
        )
        .sort((a, b) => a.time.localeCompare(b.time));

    const handleSaveEvolution = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedAppointmentId) {
            updateAppointmentStatus(selectedAppointmentId, 'completed');
            setSelectedAppointmentId(null);
            setEvolution('');
            // In a real app, we would save the evolution text to a sub-collection
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Atendimentos</h1>
                    <p className="text-slate-500 font-medium">Fila de espera e evolução clínica do dia.</p>
                </div>
                <div className="bg-cyan-50 text-cyan-brand px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                    <Activity size={20} />
                    {queue.filter(a => a.status === 'confirmed').length} na fila
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {queue.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-3">
                            <CheckCircle2 size={32} />
                        </div>
                        <p className="text-slate-500 font-medium">Nenhum atendimento na fila hoje.</p>
                        <p className="text-xs text-slate-400">Confirme agendamentos na Agenda para vê-los aqui.</p>
                    </div>
                ) : (
                    queue.map((apt) => {
                        const patient = patients.find(p => p.id === apt.patientId);
                        const isCompleted = apt.status === 'completed';

                        return (
                            <div
                                key={apt.id}
                                className={cn(
                                    "bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative overflow-hidden transition-all",
                                    isCompleted ? "opacity-75 grayscale-[0.5]" : "hover:shadow-md hover:border-cyan-100"
                                )}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2 text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-lg text-xs">
                                        <Clock size={12} />
                                        {apt.time}
                                    </div>
                                    <div className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                        isCompleted ? "bg-green-100 text-green-700" : "bg-cyan-100 text-cyan-700"
                                    )}>
                                        {isCompleted ? 'Finalizado' : 'Aguardando'}
                                    </div>
                                </div>

                                <h3 className="font-bold text-slate-800 text-lg mb-1">{patient?.name}</h3>
                                <p className="text-sm text-slate-500 font-medium mb-6">{apt.service}</p>

                                <Button
                                    className="w-full"
                                    variant={isCompleted ? "outline" : "primary"}
                                    onClick={() => setSelectedAppointmentId(apt.id)}
                                    disabled={isCompleted}
                                >
                                    {isCompleted ? 'Ver Evolução' : 'Iniciar Atendimento'}
                                </Button>
                            </div>
                        );
                    })
                )}
            </div>

            <Modal
                isOpen={!!selectedAppointmentId}
                onClose={() => setSelectedAppointmentId(null)}
                title="Evolução Clínica"
                className="max-w-2xl"
            >
                <form onSubmit={handleSaveEvolution} className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm font-bold text-slate-500">Paciente</span>
                            <span className="text-sm font-bold text-slate-800">
                                {patients.find(p => p.id === appointments.find(a => a.id === selectedAppointmentId)?.patientId)?.name}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-bold text-slate-500">Serviço</span>
                            <span className="text-sm font-bold text-slate-800">
                                {appointments.find(a => a.id === selectedAppointmentId)?.service}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 ml-1">Descrição do Atendimento (SOAP)</label>
                        <textarea
                            value={evolution}
                            onChange={(e) => setEvolution(e.target.value)}
                            className="w-full h-40 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-brand/20 focus:border-cyan-brand transition-all resize-none"
                            placeholder="Descreva a evolução do paciente..."
                            required
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="ghost" className="flex-1" onClick={() => setSelectedAppointmentId(null)}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                            Finalizar Atendimento
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
