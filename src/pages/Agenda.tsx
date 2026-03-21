import React, { useState, useEffect } from 'react';
import { useAppointments } from '../hooks/useAppointments';
import { usePatients } from '../hooks/usePatients';
import { useServices } from '../hooks/useServices';
import { supabase } from '../lib/supabase';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
    parseISO,
    addMinutes,
    isBefore,
    isAfter,
    isEqual
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    Clock,
    User,
    MoreVertical
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';

export const Agenda = () => {
    const { appointments } = useAppointments();
    const { patients } = usePatients();
    const { services } = useServices();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [newAppointment, setNewAppointment] = useState({
        patientId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        service: 'Fisioterapia',
        notes: ''
    });

    useEffect(() => {
        setNewAppointment(prev => ({ ...prev, date: format(selectedDate, 'yyyy-MM-dd') }));
    }, [selectedDate]);

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
    const selectedDateAppointments = appointments.filter(apt =>
        apt.date === formattedSelectedDate
    ).sort((a, b) => a.time.localeCompare(b.time));

    const checkOverlap = (newDate: string, newTime: string, newDuration: number, excludeId?: string) => {
        const newStart = parseISO(`${newDate}T${newTime}`);
        const newEnd = addMinutes(newStart, newDuration);

        for (const apt of appointments) {
            // Ignore if it's the same appointment (in case of edits, though we only create here for now)
            if (excludeId && apt.id === excludeId) continue;
            
            // Only care about same date
            if (apt.date !== newDate) continue;

            // Ignore completed or cancelled
            if (['REALIZADO', 'CONFIRMADO', 'CANCELADO'].includes(apt.status)) continue;

            const aptStart = parseISO(`${apt.date}T${apt.time}`);
            const aptDuration = apt.duration || 60;
            const aptEnd = addMinutes(aptStart, aptDuration);

             // Overlap logic: (StartA < EndB) and (EndA > StartB)
             if (isBefore(newStart, aptEnd) && isAfter(newEnd, aptStart)) {
                 const aptPatient = patients.find(p => p.id === apt.patientId)?.name || apt.tempGuestName || 'Cliente';
                 const aptService = apt.serviceName || 'Serviço';
                 return { hasOverlap: true, serviceName: aptService, patientName: aptPatient };
             }
        }
        return { hasOverlap: false };
    };


    const getAvailableTimes = () => {
        const isTodaySelected = newAppointment.date === format(new Date(), 'yyyy-MM-dd');
        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();

        const times = [];
        for (let h = 7; h <= 20; h++) {
            for (let m = 0; m < 60; m += 30) {
                if (isTodaySelected && (h < currentHour || (h === currentHour && m <= currentMinute))) {
                    continue; // Skip past times
                }
                const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                times.push(timeStr);
            }
        }
        return times;
    };

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();

        const appointmentDateTime = parseISO(`${newAppointment.date}T${newAppointment.time}`);
        if (isBefore(appointmentDateTime, new Date())) {
            return alert('Não é permitido realizar agendamentos em horários que já passaram.');
        }

        const [year, month, day] = newAppointment.date.split('-').map(Number);
        const appointmentDate = new Date(year, month - 1, day);
        if (appointmentDate.getDay() === 0) {
            return alert('Não há expediente aos domingos (Folga). Escolha outra data.');
        }

        if (!newAppointment.patientId) return alert('Selecione um paciente');

        const selectedPatient = patients.find(p => p.id === newAppointment.patientId);
        const selectedService = services.find(s => s.name === newAppointment.service);
        const duration = selectedService?.duration || 60;

        // Validar Conflito (Frontend)
        const overlap = checkOverlap(newAppointment.date, newAppointment.time, duration);
        if (overlap.hasOverlap) {
            return alert(`Nesse horário você ainda estará fazendo o serviço ${overlap.serviceName} do ${overlap.patientName}`);
        }

        try {
            const { error } = await supabase.from('appointments').insert([{
                patientId: newAppointment.patientId,
                date: newAppointment.date,
                time: newAppointment.time,
                serviceName: newAppointment.service,
                status: 'PENDENTE',
                value: selectedService?.value || 0,
                tempGuestName: selectedPatient?.name,
                tempGuestPhone: selectedPatient?.phone,
                duration: duration
            }]);

            if (error) {
                // Em caso do trigger estourar antes ou outro erro
                if(error.message.includes('Nesse horário você ainda estará fazendo') || error.message.includes('Não é permitido realizar agendamentos')) {
                    alert(error.message);
                } else {
                    throw error;
                }
                return;
            }

            setIsModalOpen(false);
            setNewAppointment({ patientId: '', date: format(selectedDate, 'yyyy-MM-dd'), time: '09:00', service: 'Fisioterapia', notes: '' });
        } catch (error: any) {
            console.error('Erro ao agendar:', error);
            alert('Não foi possível salvar o agendamento.');
        }
    };

    const updateAppointmentStatus = async (apt: any, status: string) => {
        try {
            const { error } = await supabase.from('appointments').update({ status }).eq('id', apt.id);
            if (error) throw error;

            if (status === 'REALIZADO') {
                const { error: txError } = await supabase.from('transactions').insert([{
                    description: `Atendimento: ${apt.tempGuestName || 'Paciente'} - ${apt.serviceName || 'Serviço'}`,
                    amount: apt.value || 0,
                    type: 'RECEITA',
                    status: 'PENDENTE',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    notes: 'Faturamento automático'
                }]);

                if (txError) {
                    console.error('Erro ao gerar receita.', txError);
                } else {
                    alert('Atendimento concluído e receita adicionada ao caixa!');
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Falha ao atualizar o agendamento.');
        }
    };

    const getDayStatus = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const hasAppointments = appointments.some(apt => apt.date === dateStr);
        return hasAppointments ? 'has-appointments' : 'empty';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Agenda</h1>
                    <p className="text-slate-500 font-medium">Gerencie seus atendimentos e horários.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2" size={20} />
                    Novo Agendamento
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-8 bg-white rounded-[32px] shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-800 capitalize">
                            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                                className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                                className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-4 mb-4">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(day => (
                            <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-3">
                        {daysInMonth.map((date) => {
                            const status = getDayStatus(date);
                            const isSelected = isSameDay(date, selectedDate);
                            const isTodayDate = isToday(date);
                            const isSunday = date.getDay() === 0;

                            return (
                                <button
                                    key={date.toISOString()}
                                    onClick={() => setSelectedDate(date)}
                                    className={cn(
                                        "aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all",
                                        isSelected
                                            ? (isSunday ? "bg-slate-700 text-white shadow-lg shadow-slate-700/20 scale-105" : "bg-cyan-brand text-white shadow-lg shadow-cyan-brand/20 scale-105")
                                            : isSunday
                                                ? "bg-slate-50 text-slate-400 border border-dashed border-slate-200 hover:bg-slate-100"
                                                : "bg-slate-50 text-slate-600 hover:bg-cyan-50 hover:text-cyan-600",
                                        isTodayDate && !isSelected && "border-2 border-cyan-brand text-cyan-brand"
                                    )}
                                >
                                    <span className="text-sm font-bold">{format(date, 'd')}</span>
                                    {isSunday && !isSelected && (
                                        <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5 tracking-tighter" style={{ lineHeight: 1 }}>Folga</span>
                                    )}
                                    {isSunday && isSelected && (
                                        <span className="text-[9px] uppercase font-bold text-slate-300 mt-0.5 tracking-tighter" style={{ lineHeight: 1 }}>Folga</span>
                                    )}
                                    {status === 'has-appointments' && !isSunday && (
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full mt-1",
                                            isSelected ? "bg-white" : "bg-cyan-brand"
                                        )} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Daily Schedule */}
                <div className="lg:col-span-4 bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 flex flex-col h-[600px]">
                    <div className="mb-6 pb-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">
                            {format(selectedDate, "EEEE, d 'of' MMMM", { locale: ptBR })}
                        </h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            {selectedDateAppointments.length} agendamentos previstos
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 relative">
                        {/* Render simple list instead of complex timeline, but scale height based on duration */}
                        {selectedDateAppointments.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                                    <CalendarIcon size={32} />
                                </div>
                                {selectedDate.getDay() === 0 ? (
                                    <>
                                        <p className="text-slate-500 font-bold text-lg">Folga ☕</p>
                                        <p className="text-slate-400 text-sm mt-1">Indisponível para agendamentos neste dia.</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-slate-500 font-medium">Nenhum agendamento para este dia.</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-4 text-cyan-brand"
                                            onClick={() => setIsModalOpen(true)}
                                        >
                                            Agendar Agora
                                        </Button>
                                    </>
                                )}
                            </div>
                        ) : (
                            selectedDateAppointments.map(apt => {
                                const patient = patients.find(p => p.id === apt.patientId);
                                const aptDuration = apt.duration || 60;
                                // 1 hora (60min) = 8rem = 128px de base de altura pra manter consistência. (Cálculo ~2.1px por min)
                                // Se estiver finalizado/confirmado = reduz um pouco a ênfase (puxa altura normal ou opacidade)
                                const isFinished = ['REALIZADO', 'CONFIRMADO', 'CANCELADO'].includes(apt.status);
                                // The visual block height is proportional to the duration, except if it's finished/cancelled
                                const minHeightClass = isFinished ? "min-h-[6rem]" : "min-h-[8rem]";
                                
                                return (
                                    <div 
                                        key={apt.id} 
                                        className={cn(
                                            "group relative bg-[#f8fafc] rounded-2xl p-4 transition-all border",
                                            isFinished ? "opacity-75 border-slate-200 hover:border-slate-300" : "hover:bg-cyan-50 border-transparent hover:border-cyan-100 border-l-4 border-l-cyan-brand",
                                            minHeightClass
                                        )}
                                        style={{ minHeight: isFinished ? 'auto' : `${Math.max(120, aptDuration * 2)}px` }}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2 text-cyan-brand font-bold bg-white px-3 py-1 rounded-lg text-xs shadow-sm">
                                                <Clock size={12} />
                                                {apt.time} - {format(addMinutes(parseISO(`${apt.date}T${apt.time}`), aptDuration), 'HH:mm')}
                                            </div>
                                            <div className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                                apt.status === 'CONFIRMADO' ? "bg-green-100 text-green-700" :
                                                    apt.status === 'REALIZADO' ? "bg-emerald-100 text-emerald-800" :
                                                    apt.status === 'PENDENTE' ? "bg-orange-100 text-orange-700" :
                                                        "bg-slate-200 text-slate-600"
                                            )}>
                                                {apt.status}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-slate-800">{patient?.name || apt.tempGuestName || 'Cliente'}</h4>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{apt.serviceName || 'Serviço'} ({aptDuration} min)</p>
                                        </div>

                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-slate-400 hover:text-cyan-brand">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>

                                        {/* Simulator of Actions */}
                                        <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity h-0 group-hover:h-auto overflow-hidden">
                                            {apt.status === 'PENDENTE' && (
                                                <button
                                                    onClick={() => updateAppointmentStatus(apt, 'CONFIRMADO')}
                                                    className="flex-1 bg-white border border-emerald-100 text-emerald-600 text-xs font-bold py-2 rounded-lg hover:bg-emerald-50 transition-colors"
                                                >
                                                    Confirmar
                                                </button>
                                            )}
                                            {(apt.status === 'PENDENTE' || apt.status === 'CONFIRMADO') && (
                                                <button
                                                    onClick={() => updateAppointmentStatus(apt, 'REALIZADO')}
                                                    className="flex-1 bg-cyan-brand text-white text-xs font-bold py-2 rounded-lg hover:bg-cyan-600 transition-colors shadow-sm shadow-cyan-brand/20"
                                                >
                                                    Finalizar
                                                </button>
                                            )}
                                            {apt.status !== 'CANCELADO' && apt.status !== 'REALIZADO' && (
                                                <button
                                                    onClick={() => updateAppointmentStatus(apt, 'CANCELADO')}
                                                    className="flex-1 bg-white border border-rose-100 text-rose-500 text-xs font-bold py-2 rounded-lg hover:bg-rose-50 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Agendamento"
            >
                <form onSubmit={handleCreateAppointment} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Paciente</label>
                        <select
                            value={newAppointment.patientId}
                            onChange={(e) => setNewAppointment({ ...newAppointment, patientId: e.target.value })}
                            className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-brand/20 focus:border-cyan-brand"
                            required
                        >
                            <option value="">Selecione...</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Data"
                            type="date"
                            min={format(new Date(), 'yyyy-MM-dd')}
                            value={newAppointment.date}
                            onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                            className="bg-slate-50"
                            required
                        />
                        <div className="space-y-1.5 mt-0">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Horário</label>
                            <select
                                value={newAppointment.time}
                                onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-brand/20 focus:border-cyan-brand"
                                required
                            >
                                <option value="">Selecione...</option>
                                {getAvailableTimes().map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5 mt-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Serviço</label>
                        <select
                            value={newAppointment.service}
                            onChange={(e) => setNewAppointment({ ...newAppointment, service: e.target.value })}
                            className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-brand/20 focus:border-cyan-brand"
                            required
                        >
                            <option value="">Selecione...</option>
                            {services.map(s => (
                                <option key={s.id} value={s.name}>{s.name} - R$ {s.value}</option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Observações"
                        placeholder="Alguma nota especial?"
                        value={newAppointment.notes}
                        onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                    />

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                            Agendar
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

