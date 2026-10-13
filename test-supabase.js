const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://jjvxsjuzcnxgfbocsqia.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdnhzanV6Y254Z2Zib2NzcWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzgzNDUsImV4cCI6MjA4NDA1NDM0NX0.P5s9fvcc3zaOpyQRSv2LCRbHXR3syEjhjGRzmkoUdz8'
);

async function test() {
  const { data, error } = await supabase.from('conductores').insert([{
    nombre: "Test Name",
    direccion: "Test Address",
    telefono: "5519553555",
    correo: "mike.vazq2@hotmail.es",
    contrasena: "password123"
  }]).select();
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
