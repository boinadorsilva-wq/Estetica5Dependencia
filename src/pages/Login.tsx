import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, UserRole } from '../store/useStore';
import { Activity, UserCircle2, ShieldCheck, User } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('GESTOR');
    const navigate = useNavigate();
    const login = useStore((state) => state.login);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simplified Auth for Preview
        login({
            id: '123',
            name: email.split('@')[0] || 'Usuário Teste',
            email: email || 'usuario@teste.com',
            role,
        });
        navigate('/inicio');
    };

    const roles = [
        { id: 'GESTOR', label: 'Gestor de Clínica', icon: ShieldCheck, desc: 'Acesso total' },
        { id: 'AUTONOMO', label: 'Fisio Autônomo', icon: UserCircle2, desc: 'Sem Admin' },
        { id: 'COLABORADOR', label: 'Colaborador', icon: User, desc: 'Acesso Restrito' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] shadow-2xl p-8 md:p-12 w-full max-w-md border border-white/50">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-cyan-50 text-cyan-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Activity size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">GestãoFisio</h1>
                    <p className="text-slate-500 text-sm">Acesse sua conta para continuar</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Selecione seu Perfil</label>
                        <div className="grid grid-cols-1 gap-2">
                            {roles.map((r) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setRole(r.id as UserRole)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${role === r.id
                                            ? 'border-cyan-brand bg-cyan-50 text-cyan-900'
                                            : 'border-slate-100 hover:border-cyan-200 text-slate-600'
                                        }`}
                                >
                                    <r.icon size={20} className={role === r.id ? 'text-cyan-brand' : 'text-slate-400'} />
                                    <div>
                                        <div className="font-bold text-sm">{r.label}</div>
                                        <div className="text-xs opacity-70">{r.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail</label>
                        <input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-brand/20 focus:border-cyan-brand transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Senha</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-brand/20 focus:border-cyan-brand transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-cyan-brand hover:bg-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-brand/20 transition-all active:scale-95"
                    >
                        Entrar no Sistema
                    </button>
                </form>
            </div>
        </div>
    );
};
