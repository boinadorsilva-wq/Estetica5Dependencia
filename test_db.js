const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://dkmrvmyqhiubboachgci.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbXJ2bXlxaGl1YmJvYWNoZ2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTc2NDMsImV4cCI6MjA4OTQzMzY0M30.OOszVJed_5-lHEwXe7ziMheMdL0s9aqhnEKHc31fIDU'
);

async function run() {
    const { data, error } = await supabase.from('appointments').select('*').order('id', { ascending: false }).limit(20);
    console.log("Error:", error);
    console.log("Last 20 appointments:");
    data.forEach((row, i) => console.log(i, row.id, row.tempGuestName, row.date, row.status, row.physioId));
}

run();
