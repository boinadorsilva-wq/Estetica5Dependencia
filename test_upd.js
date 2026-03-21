import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nwonrfjenxcnokrhwtkn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53b25yZmplbnhjbm9rcmh3dGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzY2NDMsImV4cCI6MjA4ODMxMjY0M30.N7OhqynDd3LKCmfWo-aItZlzYPRM0LsyMt8JSYsTu-Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching one appointment...');
    const appts = await supabase.from('appointments').select('*').limit(1);
    console.log('Appt:', appts.data);

    if (appts.data && appts.data.length > 0) {
        const id = appts.data[0].id;
        console.log('Attempting to update id =', id);
        const { error, data } = await supabase
            .from('appointments')
            .update({ status: 'CONFIRMADO', paymentMethod: 'Dinheiro' })
            .eq('id', id);
        console.log('Update return:', { data, error });
    }
    process.exit(0);
}
run();
