import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ScheduleSetting {
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  almoco_inicio: string | null;
  almoco_fim: string | null;
  esta_ativo: boolean;
}

export interface AgendaBlock {
  id: string;
  descricao: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
}

const DEFAULT_SETTINGS: ScheduleSetting[] = [
  { dia_semana: 0, hora_inicio: '08:00:00', hora_fim: '17:00:00', esta_ativo: false, almoco_inicio: '12:00:00', almoco_fim: '13:00:00' },
  { dia_semana: 1, hora_inicio: '08:00:00', hora_fim: '18:00:00', esta_ativo: true,  almoco_inicio: '12:00:00', almoco_fim: '13:00:00' },
  { dia_semana: 2, hora_inicio: '08:00:00', hora_fim: '18:00:00', esta_ativo: true,  almoco_inicio: '12:00:00', almoco_fim: '13:00:00' },
  { dia_semana: 3, hora_inicio: '08:00:00', hora_fim: '18:00:00', esta_ativo: true,  almoco_inicio: '12:00:00', almoco_fim: '13:00:00' },
  { dia_semana: 4, hora_inicio: '08:00:00', hora_fim: '18:00:00', esta_ativo: true,  almoco_inicio: '12:00:00', almoco_fim: '13:00:00' },
  { dia_semana: 5, hora_inicio: '08:00:00', hora_fim: '18:00:00', esta_ativo: true,  almoco_inicio: '12:00:00', almoco_fim: '13:00:00' },
  { dia_semana: 6, hora_inicio: '08:00:00', hora_fim: '13:00:00', esta_ativo: false, almoco_inicio: null,       almoco_fim: null        },
];

let globalSettingsCache: ScheduleSetting[] | null = null;
let globalBlocksCache: AgendaBlock[] | null = null;

export function useScheduleSettings({ publicMode = false } = {}) {
  const [settings, setSettings] = useState<ScheduleSetting[]>(globalSettingsCache ?? []);
  const [blocks, setBlocks] = useState<AgendaBlock[]>(globalBlocksCache ?? []);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    console.log('[fetchSettings] SELECT obrigatório SWR');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!publicMode && !session?.user) {
         const { data: refreshed } = await supabase.auth.refreshSession();
         if (!refreshed.session?.user) {
             setLoading(false);
             return;
         }
      }

      const { data, error } = await supabase
        .from('horarios_funcionamento')
        .select('*')
        .order('dia_semana');

      console.log('[useScheduleSettings] Dados:', data, 'Erro:', error);
      if (data && !error) console.log('Tabela ScheduleSettings carregou:', data);

      if (error) {
        console.warn('[useScheduleSettings] Erro ao buscar horários - mantendo cache', error.message);
      } else if (data && data.length > 0) {
        globalSettingsCache = data;
        setSettings(data);
      } else {
        // Banco novo/vazio: inicializa com defaults e persiste
        globalSettingsCache = DEFAULT_SETTINGS;
        setSettings(DEFAULT_SETTINGS);
        try {
          await supabase.from('horarios_funcionamento').insert(DEFAULT_SETTINGS);
        } catch (seedErr) {
          console.warn('Não foi possível persistir os horários padrão:', seedErr);
        }
      }
    } catch (err) {
      console.warn('Exceção ao buscar horários:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async () => {
    console.log('[fetchBlocks] SELECT obrigatório SWR');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!publicMode && !session?.user) {
         return; // Proteção simples
      }

      const { data, error } = await supabase
        .from('bloqueios_agenda')
        .select('*');

      console.log('[fetchBlocks] Dados:', data, 'Erro:', error);

      if (error) {
         console.warn('[fetchBlocks] Erro ao buscar bloqueios - mantendo cache', error.message);
      } else if (data) {
         globalBlocksCache = data;
         setBlocks(data);
      }
    } catch (err) {
      console.warn('Exceção ao buscar bloqueios:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchBlocks();
    
    // Subscribe to realtime changes
    const horariosChannelName = 'horarios_' + Math.random().toString(36).substring(7);
    const settingsSub = supabase.channel(horariosChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'horarios_funcionamento' }, fetchSettings)
      .subscribe();

    const blocksChannelName = 'bloqueios_' + Math.random().toString(36).substring(7);
    const blocksSub = supabase.channel(blocksChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bloqueios_agenda' }, fetchBlocks)
      .subscribe();

    return () => {
      supabase.removeChannel(settingsSub);
      supabase.removeChannel(blocksSub);
    };
  }, []);

  const updateSetting = async (dia_semana: number, payload: Partial<ScheduleSetting>) => {
    const { error } = await supabase
      .from('horarios_funcionamento')
      .update(payload)
      .eq('dia_semana', dia_semana);
      
    if (error) throw error;
    // Realtime listener triggers state update
  };

  const createBlock = async (payload: Omit<AgendaBlock, 'id'>) => {
    // Optimistic Update
    const tempId = 'temp-' + Date.now();
    const newBlockData = { id: tempId, ...payload };
    setBlocks(prev => [...prev, newBlockData]);

    const { error } = await supabase
      .from('bloqueios_agenda')
      .insert([payload]);
      
    if (error) {
      setBlocks(prev => prev.filter(b => b.id !== tempId));
      throw error;
    }
  };

  const deleteBlock = async (id: string) => {
     // Optimistic Update
     const previousBlocks = [...blocks];
     setBlocks(prev => prev.filter(b => b.id !== id));

     const { error } = await supabase
        .from('bloqueios_agenda')
        .delete()
        .eq('id', id);
        
     if (error) {
       setBlocks(previousBlocks);
       throw error;
     }
  };

  return {
    settings,
    blocks,
    loading,
    updateSetting,
    createBlock,
    deleteBlock
  };
}
