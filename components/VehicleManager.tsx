"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Loader2, Edit2, Upload, Trash2, Car, Users, Plus, Tag } from "lucide-react";

export default function VehicleManager() {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [conductores, setConductores] = useState<any[]>([]);
    const [newVehicle, setNewVehicle] = useState({
        model: "",
        brand: "",
        year: "",
        color: "",
        plates: "",
        capacity: "5",
        availability: true,
        categoria_id: "",
        conductor_id: "",
        VerEnWeb: false
    });

    const [searchTerm, setSearchTerm] = useState("");
    
    // Edit state
    const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Categories
            const { data: cats } = await supabase.from('categorias_vehiculos').select('*').order('nombre');
            setCategories(cats || []);

            // Fetch Vehicles with Category name and Conductor name
            const { data: vehs, error } = await supabase
                .from('Vehículos')
                .select('*, categorias_vehiculos(nombre), conductores(nombre)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVehicles(vehs || []);

            // Fetch Conductors
            const { data: conds } = await supabase.from('conductores').select('id, nombre').order('nombre');
            setConductores(conds || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleUpload = async () => {
        if (!file || !newVehicle.model || !newVehicle.brand || !newVehicle.capacity || !newVehicle.categoria_id) {
            alert("Por favor completa los campos obligatorios (Modelo, Marca, Pasajeros, Categoría) e incluye una imagen.");
            return;
        }

        setUploading(true);
        try {
            // 1. Upload image to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('Autos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('Autos')
                .getPublicUrl(filePath);

            // 3. Insert into Database
            const { error: insertError } = await supabase
                .from('Vehículos')
                .insert({
                    Modelo: newVehicle.model,
                    marca: newVehicle.brand,
                    año: newVehicle.year ? parseInt(newVehicle.year) : null,
                    color: newVehicle.color,
                    placas: newVehicle.plates,
                    capacidadDeCarga: parseFloat(newVehicle.capacity),
                    imagen: publicUrl,
                    Disponibilidad: true,
                    categoria_id: parseInt(newVehicle.categoria_id),
                    conductor_id: newVehicle.conductor_id || null,
                    VerEnWeb: newVehicle.VerEnWeb
                });

            if (insertError) throw insertError;

            // 4. Reset form and refresh list
            setFile(null);
            setPreviewUrl(null);
            setNewVehicle({ 
                model: "", brand: "", year: "", color: "", plates: "", capacity: "5", availability: true, categoria_id: "", conductor_id: "", VerEnWeb: false
            });
            if (fileInputRef.current) fileInputRef.current.value = "";

            await fetchData();
            alert("Vehículo agregado exitosamente");

        } catch (error) {
            console.error("Error uploading vehicle:", error);
            alert("Error al subir el vehículo.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number, imagePath: string) => {
        // Verificar si el vehículo tiene un conductor asignado antes de permitir borrar
        const vehicleToDelete = vehicles.find(v => v.id === id);
        if (vehicleToDelete?.conductor_id) {
            alert("No se puede eliminar: Este vehículo tiene un conductor asignado. Por favor, desvincula al conductor desde la edición del vehículo antes de borrarlo.");
            return;
        }

        if (!confirm("¿Estás seguro de que quieres eliminar este vehículo?")) return;

        try {
            const { error } = await supabase
                .from('Vehículos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setVehicles(prev => prev.filter(v => v.id !== id));

        } catch (error) {
            console.error("Error deleting vehicle:", error);
            alert("Error al eliminar el vehículo.");
        }
    };

    const handleUpdate = async () => {
        if (!editingVehicle) return;

        setUploading(true);
        try {
            let finalImageUrl = editingVehicle.imagen;

            // If there's a new file for editing
            if (editFile) {
                const fileExt = editFile.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('Autos')
                    .upload(filePath, editFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('Autos')
                    .getPublicUrl(filePath);
                
                finalImageUrl = publicUrl;
            }

            const { error } = await supabase
                .from('Vehículos')
                .update({
                    Modelo: editingVehicle.Modelo,
                    marca: editingVehicle.marca,
                    año: editingVehicle.año ? parseInt(editingVehicle.año) : null,
                    color: editingVehicle.color,
                    placas: editingVehicle.placas,
                    puertas: editingVehicle.puertas ? parseInt(editingVehicle.puertas) : null,
                    capacidadDeCarga: parseFloat(editingVehicle.capacidadDeCarga),
                    categoria_id: parseInt(editingVehicle.categoria_id),
                    conductor_id: editingVehicle.conductor_id || null,
                    VerEnWeb: editingVehicle.VerEnWeb,
                    imagen: finalImageUrl
                })
                .eq('id', editingVehicle.id);

            if (error) throw error;

            setIsEditModalOpen(false);
            setEditingVehicle(null);
            setEditFile(null);
            setEditPreviewUrl(null);
            await fetchData();
            alert("Vehículo actualizado correctamente.");

        } catch (error) {
            console.error("Error updating vehicle:", error);
            alert("Error al actualizar el vehículo.");
        } finally {
            setUploading(false);
        }
    };

    const handleToggleAvailability = async (id: number, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('Vehículos')
                .update({ Disponibilidad: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            setVehicles(prev => prev.map(v =>
                v.id === id ? { ...v, Disponibilidad: !currentStatus } : v
            ));
        } catch (error) {
            console.error("Error updating availability:", error);
            alert("Error al actualizar la disponibilidad.");
        }
    };

    return (
        <div className="space-y-8">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
                        <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Agregar Nuevo Vehículo
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Nissan"
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
                                        value={newVehicle.brand}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Versa"
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
                                        value={newVehicle.model}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                                    <input
                                        type="number"
                                        placeholder="2024"
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
                                        value={newVehicle.year}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                    <input
                                        type="text"
                                        placeholder="Blanco"
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
                                        value={newVehicle.color}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pasajeros</label>
                                    <input
                                        type="number"
                                        placeholder="5"
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
                                        value={newVehicle.capacity}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Placas</label>
                                <input
                                    type="text"
                                    placeholder="Ej. ABC-123-D"
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
                                    value={newVehicle.plates}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, plates: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                    <select
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm appearance-none bg-white"
                                        value={newVehicle.categoria_id}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, categoria_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Conductor Designado</label>
                                <select
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm appearance-none bg-white"
                                    value={newVehicle.conductor_id}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, conductor_id: e.target.value })}
                                >
                                    <option value="">Sin conductor asignado</option>
                                    {conductores.map(cond => (
                                        <option key={cond.id} value={cond.id}>{cond.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <button
                                    onClick={() => setNewVehicle({ ...newVehicle, VerEnWeb: !newVehicle.VerEnWeb })}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${newVehicle.VerEnWeb ? 'bg-black' : 'bg-gray-200'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${newVehicle.VerEnWeb ? 'left-6' : 'left-1'}`} />
                                </button>
                                <span className="text-sm font-medium text-gray-700">Mostrar en la web pública</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Vehículo</label>
                                <div
                                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${previewUrl ? "border-green-300 bg-green-50" : "border-gray-200 hover:bg-gray-50"
                                        }`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {previewUrl ? (
                                        <div className="relative h-40 w-full">
                                            <Image
                                                src={previewUrl}
                                                alt="Preview"
                                                fill
                                                className="object-contain"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                                <span className="text-white font-medium text-sm">Cambiar Imagen</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-500">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <span className="text-sm">Click para subir imagen</span>
                                            <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (Max 5MB)</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className={`w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 ${uploading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
                                    }`}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Subiendo...
                                    </>
                                ) : (
                                    "Subir Vehículo"
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Vehicle List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Car className="w-5 h-5" /> Flotilla Actual
                            </h3>
                            
                            <div className="relative w-full sm:w-64">
                                <Plus className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-45" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar vehículo..." 
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-black transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        ) : vehicles.length === 0 ? (
                            <div className="bg-gray-50 rounded-xl p-12 text-center text-gray-500 border border-gray-100 border-dashed">
                                <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No hay vehículos registrados aún.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {vehicles
                                    .filter(v => 
                                        v.Modelo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        v.marca?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        v.placas?.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map((vehicle) => (
                                    <div
                                        key={vehicle.id}
                                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 items-start sm:items-center group hover:shadow-md transition-all relative overflow-hidden"
                                    >
                                        <div className="w-32 h-20 relative bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden border border-gray-50">
                                            {vehicle.imagen ? (
                                                <Image
                                                    src={vehicle.imagen && (vehicle.imagen.includes("ejeturmex.com") || vehicle.imagen.includes("taxiseguro.com")) ? `/images/${vehicle.imagen.split("/").pop()}` : vehicle.imagen}
                                                    alt={vehicle.Modelo}
                                                    fill
                                                    className="object-contain p-1"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Car className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900 truncate">{vehicle.marca} {vehicle.Modelo}</h4>
                                                {vehicle.año && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{vehicle.año}</span>}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3.5 h-3.5" />
                                                    <span>Pasajeros: {vehicle.capacidadDeCarga}</span>
                                                </div>
                                                {vehicle.placas && (
                                                    <div className="flex items-center gap-1">
                                                        <Tag className="w-3.5 h-3.5" />
                                                        <span>{vehicle.placas}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1 text-blue-600 font-medium">
                                                    <Car className="w-3.5 h-3.5" />
                                                    <span>{vehicle.categorias_vehiculos?.nombre || 'Sin categoría'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mt-2 p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                                <Users className="w-3 h-3 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">
                                                    {vehicle.conductores?.nombre ? `Conductor: ${vehicle.conductores.nombre}` : "Sin conductor asignado"}
                                                </span>
                                            </div>

                                            {/* Availability and Web Switch */}
                                            <div className="flex items-center justify-between gap-4 mt-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleAvailability(vehicle.id, vehicle.Disponibilidad)}
                                                        className={`w-10 h-5 rounded-full relative transition-colors ${vehicle.Disponibilidad ? 'bg-green-500' : 'bg-gray-300'}`}
                                                    >
                                                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${vehicle.Disponibilidad ? 'left-6' : 'left-1'}`} />
                                                    </button>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        {vehicle.Disponibilidad ? "Disponible" : "No disponible"}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            const { error } = await supabase.from('Vehículos').update({ VerEnWeb: !vehicle.VerEnWeb }).eq('id', vehicle.id);
                                                            if (!error) setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, VerEnWeb: !v.VerEnWeb } : v));
                                                        }}
                                                        className={`w-10 h-5 rounded-full relative transition-colors ${vehicle.VerEnWeb ? 'bg-blue-600' : 'bg-gray-300'}`}
                                                    >
                                                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${vehicle.VerEnWeb ? 'left-6' : 'left-1'}`} />
                                                    </button>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        {vehicle.VerEnWeb ? "Visible Web" : "Oculto Web"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setEditingVehicle({ ...vehicle, categoria_id: vehicle.categoria_id?.toString() });
                                                    setIsEditModalOpen(true);
                                                }}
                                                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                                                title="Editar vehículo"
                                            >
                                                <Edit2 className="w-4 h-4 cursor-pointer" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(vehicle.id, vehicle.imagen)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Eliminar vehículo"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Editar Vehículo</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Marca</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                        value={editingVehicle?.marca || ""}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, marca: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Modelo</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                        value={editingVehicle?.Modelo || ""}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, Modelo: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Año</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                        value={editingVehicle?.año || ""}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, año: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Color</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                        value={editingVehicle?.color || ""}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, color: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Pasajeros</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                        value={editingVehicle?.capacidadDeCarga || ""}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, capacidadDeCarga: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Pasajeros</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                        value={editingVehicle?.capacidadDeCarga || ""}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, capacidadDeCarga: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Categoría</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none text-sm"
                                        value={editingVehicle?.categoria_id || ""}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, categoria_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Placas</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                        value={editingVehicle?.placas || ""}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, placas: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Conductor</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none text-sm"
                                        value={editingVehicle?.conductor_id || ""}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, conductor_id: e.target.value })}
                                    >
                                        <option value="">Sin conductor asignado</option>
                                        {conductores.map(cond => (
                                            <option key={cond.id} value={cond.id}>{cond.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <button
                                    onClick={() => setEditingVehicle({ ...editingVehicle, VerEnWeb: !editingVehicle.VerEnWeb })}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${editingVehicle?.VerEnWeb ? 'bg-black' : 'bg-gray-200'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${editingVehicle?.VerEnWeb ? 'left-6' : 'left-1'}`} />
                                </button>
                                <span className="text-xs font-bold text-gray-700">Mostrar en la web pública</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Imagen del Vehículo</label>
                                <div
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => editFileInputRef.current?.click()}
                                >
                                    {(editPreviewUrl || editingVehicle?.imagen) ? (
                                        <div className="relative h-32 w-full">
                                            <Image
                                                src={editPreviewUrl || (editingVehicle?.imagen?.includes("ejeturmex.com") || editingVehicle?.imagen?.includes("taxiseguro.com") ? `/images/${editingVehicle.imagen.split("/").pop()}` : editingVehicle.imagen)}
                                                alt="Preview"
                                                fill
                                                className="object-contain"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                                                <span className="text-white font-bold text-xs">Cambiar Imagen</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-400">
                                            <Upload className="w-6 h-6 mb-1" />
                                            <span className="text-xs">Click para subir</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={editFileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const selectedFile = e.target.files[0];
                                                setEditFile(selectedFile);
                                                setEditPreviewUrl(URL.createObjectURL(selectedFile));
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleUpdate}
                                    disabled={uploading}
                                    className="w-full py-4 bg-black text-white font-bold rounded-2xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                                >
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
