import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle2, Save, Loader2 } from 'lucide-react';
import { useScheduleSettings, ScheduleSetting } from '../../hooks/useScheduleSettings';
import { cn } from '../../lib/utils';

const DIAS_SEMANA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

interface ConfigHorariosProps {
  onBack?: () => void;
}

export const ConfigHorarios = ({ onBack }: ConfigHorariosProps) => {
  const { settings, loading, updateSetting } = useScheduleSettings();
  const [localSettings, setLocalSettings] = useState<ScheduleSetting[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    // Inicializa o estado local apenas quando carregar ou quando success for finalizado
    if (settings.length > 0 && !isSaving) {
      setLocalSettings(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings]);

  const handleLocalUpdate = (dia: number, field: keyof ScheduleSetting, value: any) => {
    setLocalSettings(prev => prev.map(s => 
      s.dia_semana === dia ? { ...s, [field]: value } : s
    ));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Upsert/Update em todos os dias que foram modificados
      for (const config of localSettings) {
        await updateSetting(config.dia_semana, {
          hora_inicio: config.hora_inicio,
          hora_fim: config.hora_fim,
          esta_ativo: config.esta_ativo,
          almoco_inicio: config.almoco_inicio,
          almoco_fim: config.almoco_fim
        });
      }
      showSuccess();
    } catch (err) {
      alert('Erro ao salvar horários no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const showSuccess = () => {
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  if (loading || localSettings.length === 0) {
    return (
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
           <Loader2 className="animate-spin" size={32} />
           <p className="font-medium">Carregando painel de horários...</p>
        </div>
      </div>
    );
  }

  // Ordem visual da interface: Segunda (1) a Domingo (0)
  const logicalOrder = [1, 2, 3, 4, 5, 6, 0]; 

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
          {onBack && (
              <button 
                  onClick={onBack}
                  className="p-3 text-slate-400 hover:bg-slate-100 hover:text-slate-800 rounded-2xl transition-all"
              >
                  <ArrowLeft size={24} />
              </button>
          )}
          <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Horários</h1>
              <p className="text-slate-500 font-medium">Configure a disponibilidade e regras da agenda de forma centralizada.</p>
          </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 relative">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
               <Clock size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Horário de Funcionamento
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300",
              successMsg ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none absolute"
            )}>
              <CheckCircle2 size={16} /> Horário atualizado!
            </div>

            <button 
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {logicalOrder.map((diaIndex) => {
            const config = localSettings.find(s => s.dia_semana === diaIndex);
            if (!config) return null;

            const nome_dia = DIAS_SEMANA[diaIndex];

            return (
              <div key={diaIndex} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors rounded-2xl gap-4">
                 <span className="font-bold text-slate-700 sm:w-32">{nome_dia}</span>
                 
                 <div className="flex items-center gap-4">
                    <input 
                      type="time" 
                      value={config.hora_inicio.slice(0, 5)} 
                      onChange={(e) => handleLocalUpdate(diaIndex, 'hora_inicio', e.target.value + ':00')}
                      disabled={!config.esta_ativo || isSaving}
                      className="w-24 px-3 py-2 text-center bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-[var(--primary-color)]/20 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    <span className="text-sm font-medium text-slate-400">até</span>
                    <input 
                      type="time" 
                      value={config.hora_fim.slice(0, 5)} 
                      onChange={(e) => handleLocalUpdate(diaIndex, 'hora_fim', e.target.value + ':00')}
                      disabled={!config.esta_ativo || isSaving}
                      className="w-24 px-3 py-2 text-center bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-[var(--primary-color)]/20 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                 </div>

                 <button 
                   onClick={() => handleLocalUpdate(diaIndex, 'esta_ativo', !config.esta_ativo)}
                   disabled={isSaving}
                   className={cn(
                     "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all w-32 text-center",
                     config.esta_ativo ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105" : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:scale-105"
                   )}
                 >
                   {config.esta_ativo ? 'ATIVO' : 'FECHADO'}
                 </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
