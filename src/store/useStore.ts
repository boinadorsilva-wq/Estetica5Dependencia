import { create } from 'zustand';

export type UserRole = 'GESTOR' | 'AUTONOMO' | 'COLABORADOR';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
}

export interface Patient {
    id: string;
    name: string;
    phone: string;
    cpf: string;
    email?: string;
    notes?: string;
}

export interface Appointment {
    id: string;
    patientId: string;
    date: string; // ISO Date
    time: string; // HH:mm
    service: string;
    status: 'scheduled' | 'confirmed' | 'completed' | 'canceled';
    notes?: string;
}

export interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
}

interface AppState {
    user: User | null;
    patients: Patient[];
    appointments: Appointment[];
    transactions: Transaction[];
    login: (user: User) => void;
    logout: () => void;
    addPatient: (patient: Patient) => void;
    addAppointment: (appointment: Appointment) => void;
    updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
    addTransaction: (transaction: Transaction) => void;
}

export const useStore = create<AppState>((set) => ({
    user: null,
    patients: [
        { id: '1', name: 'Alice Silva', phone: '(11) 99999-9999', cpf: '123.456.789-00', notes: 'Dor lombar' },
        { id: '2', name: 'Bob Santos', phone: '(21) 98888-8888', cpf: '987.654.321-00', notes: 'Pós-cirúrgico LCA' }
    ],
    appointments: [
        { id: '1', patientId: '1', date: new Date().toISOString().split('T')[0], time: '09:00', service: 'Fisioterapia Manual', status: 'scheduled' },
    ],
    transactions: [
        { id: '1', date: new Date().toISOString().split('T')[0], description: 'Consulta Alice', amount: 150, type: 'income', category: 'Consultas' },
        { id: '2', date: new Date().toISOString().split('T')[0], description: 'Aluguel Sala', amount: 500, type: 'expense', category: 'Infraestrutura' }
    ],
    login: (user) => set({ user }),
    logout: () => set({ user: null }),
    addPatient: (patient) => set((state) => ({ patients: [...state.patients, patient] })),
    addAppointment: (appointment) => set((state) => ({ appointments: [...state.appointments, appointment] })),
    updateAppointmentStatus: (id, status) => set((state) => ({
        appointments: state.appointments.map(a => a.id === id ? { ...a, status } : a)
    })),
    addTransaction: (transaction) => set((state) => ({ transactions: [...state.transactions, transaction] })),
}));
