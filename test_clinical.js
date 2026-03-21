import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nwonrfjenxcnokrhwtkn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53b25yZmplbnhjbm9rcmh3dGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzY2NDMsImV4cCI6MjA4ODMxMjY0M30.N7OhqynDd3LKCmfWo-aItZlzYPRM0LsyMt8JSYsTu-Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase.from('clinical_records').insert({
        patient_id: '00000000-0000-0000-0000-000000000000',
        data: '2026-03-09',
        relatorio: 'test'
    }).select();

    console.log('Result:', data, error);
}

test();
