import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, UserRole } from '../store/useStore';
import { Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const login = useStore((state) => state.login);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                alert('Erro ao fazer login: ' + authError.message);
                setLoading(false);
                return;
            }

            if (authData.user) {
                // Fetch the user's role from the public.profiles table
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', authData.user.id)
                    .single();

                // Assign the role mapped from DB (or fallback to GESTOR)
                let userRole: UserRole = 'COLABORADOR';
                if (profile?.role === 'admin') userRole = 'GESTOR';
                if (profile?.role === 'professional' || profile?.role === 'FISIO_AUTONOMO') userRole = 'AUTONOMO';

                login({
                    id: authData.user.id,
                    name: profile?.full_name || email.split('@')[0],
                    email: authData.user.email || email,
                    role: userRole,
                });

                navigate('/inicio');
            }
        } catch (err) {
            console.error('Erro de conexão:', err);
            alert('Erro inesperado de conexão com o Supabase.');
        } finally {
            setLoading(false);
        }
    };

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
                        <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail</label>
                        <input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-brand/20 focus:border-cyan-brand transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Senha</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-brand/20 focus:border-cyan-brand transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-cyan-brand hover:bg-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-brand/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Autenticando...' : 'Entrar no Sistema'}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4">
                        Conectado ao Supabase Seguro
                    </p>
                </form>
            </div>
        </div>
    );
};
