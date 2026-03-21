import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nwonrfjenxcnokrhwtkn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53b25yZmplbnhjbm9rcmh3dGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzY2NDMsImV4cCI6MjA4ODMxMjY0M30.N7OhqynDd3LKCmfWo-aItZlzYPRM0LsyMt8JSYsTu-Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const res = await supabase.from('patients').select('id, name');
    console.log('Patients:', res.data);
    const appts = await supabase.from('appointments').select('*').ilike('patient', '%luciano%');
    console.log('Appts:', appts.data);
    process.exit(0);
}
run();
