const driverData = {
    nombre: "vdfv",
    direccion: "fvdfvfd",
    telefono: "5519553555",
    correo: "mike.vazq2+test3@hotmail.es",
    contrasena: ".........."
};

fetch('http://localhost:3000/api/admin/create-driver', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(driverData)
}).then(res => res.json()).then(data => console.log(data)).catch(console.error);
