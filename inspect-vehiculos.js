const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://jjvxsjuzcnxgfbocsqia.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdnhzanV6Y254Z2Zib2NzcWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzgzNDUsImV4cCI6MjA4NDA1NDM0NX0.P5s9fvcc3zaOpyQRSv2LCRbHXR3syEjhjGRzmkoUdz8'
);

async function inspect() {
  console.log("Inspecting 'Vehículos' table...");
  const { data, error } = await supabase.from('Vehículos').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Vehículos sample keys:", data.length > 0 ? Object.keys(data[0]) : "No data");
    console.log("Vehículos sample data:", data);
  }
}

inspect();
