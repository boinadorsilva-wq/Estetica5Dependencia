import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão definidas na Vercel!');
}

// Inicializa com url genérica se estiver faltando para não dar crash fatal na importação
export const supabase = createClient(
  supabaseUrl || 'https://missing-url.supabase.co', 
  supabaseKey || 'missing-key'
);
