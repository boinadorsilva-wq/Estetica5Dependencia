import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Professional {
  id: string;
  name: string;
  role: string;
}

let globalProfessionalsCache: Professional[] | null = null;

export function useProfessionals({ publicMode = false } = {}) {
  const [professionals, setProfessionals] = useState<Professional[]>(globalProfessionalsCache ?? []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfessionals = async () => {
      console.log('[useProfessionals] SELECT obrigatório no SWR');
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
          .from('profiles')
          .select('id, full_name, role')
          .in('role', [
            'admin', 'Admin', 'ADMIN', 'Gestor', 'GESTOR', 
            'professional', 'Professional', 'PROFISSIONAL',
            'FISIO_AUTONOMO', 'FISIO_COLABORADOR'
          ]);

        console.log('[useProfessionals] Dados:', data, 'Erro:', error);
        if (data && !error) console.log('Tabela Profiles carregou:', data);

        if (error) {
           console.warn('[useProfessionals] Erro de RLS. Fornecendo Admin fallback...', error.message);
           
           if (session?.user) {
               const fallbackProfile: Professional = {
                   id: session.user.id,
                   name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'Admin Logado',
                   role: session.user.user_metadata?.role || 'admin'
               };
               globalProfessionalsCache = [fallbackProfile];
               setProfessionals([fallbackProfile]);
           }
        } else if (data) {
          const mapped = data.map((p: any) => ({
            id: p.id,
            name: p.full_name || 'Profissional',
            role: p.role
          }));
          globalProfessionalsCache = mapped;
          setProfessionals(mapped);
        }
      } catch (err) {
        console.error('Erro ao buscar profissionais:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, []);

  return { professionals, loading };
}
