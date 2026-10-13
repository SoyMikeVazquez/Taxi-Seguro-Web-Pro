const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://jjvxsjuzcnxgfbocsqia.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdnhzanV6Y254Z2Zib2NzcWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzgzNDUsImV4cCI6MjA4NDA1NDM0NX0.P5s9fvcc3zaOpyQRSv2LCRbHXR3syEjhjGRzmkoUdz8'
);

async function inspect() {
  console.log("Inspecting 'users' table...");
  const { data: usersData, error: usersError } = await supabase.from('users').select('*').limit(1);
  console.log("Users sample:", usersData);
  console.log("Users error:", usersError);

  console.log("Inspecting 'conductores' table...");
  const { data: condData, error: condError } = await supabase.from('conductores').select('*').limit(1);
  console.log("Conductores sample:", condData);
  console.log("Conductores error:", condError);
}

inspect();
