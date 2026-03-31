
import React from 'react';
import {
  Calendar,
  Users,
  ClipboardList,
  Stethoscope,
  DollarSign,
  Settings,
  LayoutDashboard,
  FileSearch,
  Building,
  BarChart3,
  Kanban,
  UserCircle,
  Home,
} from 'lucide-react';
import { CID10, Service, User, UserRole } from './types';

export const COLORS = {
  primary: '#00a5b5',
  primaryHover: '#008c9a',
  secondary: '#64748b',
  bg: '#f8fafc',
  white: '#ffffff',
};

export const MENU_ITEMS = [
  { label: 'Início', icon: <Home size={20} />, path: 'inicio' },
  { label: 'Visão Geral', icon: <LayoutDashboard size={20} />, path: 'home' },
  { label: 'CRM / Funil', icon: <Kanban size={20} />, path: 'crm' },
  { label: 'Agenda', icon: <Calendar size={20} />, path: 'agenda' },
  { label: 'Clientes', icon: <Users size={20} />, path: 'pacientes' },
  { label: 'Relatórios', icon: <BarChart3 size={20} />, path: 'relatorios' },
  { label: 'Serviços', icon: <Stethoscope size={20} />, path: 'servicos' },
  { label: 'Financeiro', icon: <DollarSign size={20} />, path: 'financeiro' },
  { label: 'Meu Perfil', icon: <UserCircle size={20} />, path: 'perfil' },
  { label: 'Admin', icon: <Settings size={20} />, path: 'admin' },
];

export const CID10_MOCK: CID10[] = [
  { code: 'M40.0', description: 'Cifose postural' },
  { code: 'M40.1', description: 'Outras cifoses secundárias' },
  { code: 'M40.2', description: 'Cifoses outras e as não especificadas' },
  { code: 'M40.3', description: 'Síndrome da retificação da coluna vertebral' },
  { code: 'M54.5', description: 'Dor lombar baixa' },
  { code: 'G54.0', description: 'Transtornos do plexo braquial' },
];

export const USERS_MOCK: User[] = [
  {
    id: 'u1',
    name: 'Dra. Jéssica (Gestora)',
    email: 'jessica@esteticasystem.com',
    role: UserRole.ADMIN,
    avatar: 'https://picsum.photos/seed/jessica/200',
    crefito: '123456',
    document: '045.123.456-88'
  }
];
