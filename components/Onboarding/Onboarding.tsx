
import React, { useState } from 'react';
import { UserRole } from '../../types';
import { Building2, UserCircle2, CheckCircle2, ArrowRight, Link } from 'lucide-react';

interface OnboardingProps {
  onSelectRole: (role: UserRole) => void;
  userName: string;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onSelectRole, userName }) => {
  const [selected, setSelected] = useState<UserRole | null>(null);

  const roles = [
    {
      id: UserRole.ADMIN,
      title: 'Gestor de Clínica',
      description: 'Dono do negócio que gerencia múltiplos fisioterapeutas, financeiro global e agenda da clínica.',
      icon: <Building2 size={32} />,
      features: ['Gestão de Equipe', 'Financeiro Consolidado', 'Relatórios BI']
    },
    {
      id: UserRole.FISIO_AUTONOMO,
      title: 'Fisioterapeuta Autônomo',
      description: 'Profissional que trabalha sozinho. Gestão completa de agenda, pacientes e finanças próprias.',
      icon: <UserCircle2 size={32} />,
      features: ['Agenda Própria', 'Financeiro Pessoal', 'Prontuário Digital']
    },
    {
      id: UserRole.FISIO_COLABORADOR,
      title: 'Fisioterapeuta Colaborador',
      description: 'Vinculado a uma clínica. Receba convites e compartilhe dados de pacientes com seu gestor.',
      icon: <Link size={32} />,
      features: ['Sincronismo em Tempo Real', 'Base de Pacientes Compartilhada', 'Controle de Ganhos']
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="max-w-5xl w-full text-center space-y-12">
        <div className="space-y-4">
          <div className="bg-[var(--primary-color)] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-cyan-100 mb-6">
            <img src="https://placehold.co/400x400/00a5b5/ffffff.png?text=Logo" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Olá, {userName}!</h1>
          <p className="text-lg text-slate-500 font-medium">Como você pretende usar o <span className="text-[var(--primary-color)] font-bold">GestãoFisio</span>?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className={`
                relative flex flex-col items-start text-left p-8 rounded-[40px] border-4 transition-all duration-300 group
                ${selected === role.id 
                  ? 'bg-white border-[var(--primary-color)] shadow-2xl shadow-cyan-100 translate-y-[-8px]' 
                  : 'bg-white border-transparent shadow-xl shadow-slate-200/50 hover:border-slate-100 hover:translate-y-[-4px]'}
              `}
            >
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-colors
                ${selected === role.id ? 'bg-[var(--primary-color)] text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600'}
              `}>
                {role.icon}
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-3 leading-tight">{role.title}</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">
                {role.description}
              </p>

              <div className="space-y-2 mt-auto w-full">
                {role.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <CheckCircle2 size={14} className={selected === role.id ? 'text-[var(--primary-color)]' : 'text-slate-200'} />
                    {feature}
                  </div>
                ))}
              </div>

              {selected === role.id && (
                <div className="absolute top-6 right-8 text-[var(--primary-color)] animate-in zoom-in-50 duration-300">
                  <CheckCircle2 size={24} strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="pt-8">
          <button
            disabled={!selected}
            onClick={() => selected && onSelectRole(selected)}
            className={`
              flex items-center gap-3 px-12 py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all
              ${selected 
                ? 'bg-[var(--primary-color)] text-white shadow-2xl shadow-cyan-200 hover:bg-[#008c9a] active:scale-95' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
            `}
          >
            Começar Agora
            <ArrowRight size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};
