import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: q1, error: e1 } = await supabase.from('notifications').select('*').limit(1);
  console.log('notifications table:', e1 ? e1.message : 'exists');
  
  const { data: q2, error: e2 } = await supabase.from('appointments').select('*').limit(1);
  console.log('appointments keys:', q2 && q2.length ? Object.keys(q2[0]) : (e2 ? e2.message : 'empty'));
}

check();
