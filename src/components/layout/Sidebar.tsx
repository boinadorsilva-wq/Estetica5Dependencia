import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
    Home as HomeIcon,
    LayoutDashboard,
    Calendar,
    Users,
    ClipboardList,
    DollarSign,
    Settings,
    LogOut,
    Activity,
    X,
    Kanban,
    Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user, logout } = useStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    const links = [
        { to: '/inicio', label: 'Início', icon: LayoutDashboard, roles: ['GESTOR', 'AUTONOMO', 'COLABORADOR'] },
        { to: '/', label: 'Visão Geral', icon: HomeIcon, roles: ['GESTOR', 'AUTONOMO', 'COLABORADOR'] },
        { to: '/crm', label: 'CRM Comercial', icon: Kanban, roles: ['GESTOR', 'AUTONOMO', 'COLABORADOR'] },
        { to: '/agenda', label: 'Agenda', icon: Calendar, roles: ['GESTOR', 'AUTONOMO', 'COLABORADOR'] },
        { to: '/pacientes', label: 'Pacientes', icon: Users, roles: ['GESTOR', 'AUTONOMO', 'COLABORADOR'] },
        { to: '/atendimentos', label: 'Atendimentos', icon: ClipboardList, roles: ['GESTOR', 'AUTONOMO', 'COLABORADOR'] },
        { to: '/financeiro', label: 'Financeiro', icon: DollarSign, roles: ['GESTOR', 'AUTONOMO'] },
        { to: '/admin', label: 'Admin', icon: Settings, roles: ['GESTOR'] },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-brand">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h1 className="font-bold text-xl text-slate-800 tracking-tight">GestãoFisio</h1>
                            <p className="text-xs text-slate-500 font-medium">SaaS Profissional</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {links.filter(link => link.roles.includes(user.role)).map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={() => onClose()} // Close on navigation (mobile)
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                                isActive
                                    ? "bg-cyan-50 text-cyan-brand shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            )}
                        >
                            <link.icon size={20} />
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs overflow-hidden border border-slate-200">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                user.name.charAt(0)
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700 truncate">{user.name}</p>
                            <p className="text-xs text-slate-400 truncate capitalize">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut size={16} />
                        Sair do Sistema
                    </button>
                </div>
            </div>
        </>
    );
};
