"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User, Mail, Phone, MapPin, Save, Loader2, Camera } from "lucide-react";

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userRole, setUserRole] = useState<"admin" | "conductor" | null>(null);
    
    // Shared state
    const [profile, setProfile] = useState({
        id: "",
        nombre: "",
        correo: "",
        telefono: "",
        direccion: "", // strictly for conductores
        fotodeperfil: "", // strictly for users
    });

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                // Determine role
                const { data: userData } = await supabase.from('users').select('*').eq('correo', user.email).single();
                
                if (userData?.isConductor) {
                    setUserRole("conductor");
                    // Fetch extended info from conductores table
                    const { data: conductorData } = await supabase.from('conductores').select('*').eq('correo', user.email).single();
                    if (conductorData) {
                        setProfile({
                            id: conductorData.id,
                            nombre: conductorData.nombre || "",
                            correo: conductorData.correo || "",
                            telefono: conductorData.telefono || "",
                            direccion: conductorData.direccion || "",
                            fotodeperfil: userData.fotodeperfil || ""
                        });
                    }
                } else if (userData) {
                    setUserRole("admin");
                    setProfile({
                        id: userData.id,
                        nombre: userData.nombre || "",
                        correo: userData.correo || "",
                        telefono: userData.telefono || "",
                        direccion: "",
                        fotodeperfil: userData.fotodeperfil || ""
                    });
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Update users table for both
            await supabase.from("users").update({
                nombre: profile.nombre,
                telefono: profile.telefono
            }).eq("correo", profile.correo);

            // Update conductores if applicable
            if (userRole === "conductor") {
                await supabase.from("conductores").update({
                    nombre: profile.nombre,
                    telefono: profile.telefono,
                    direccion: profile.direccion
                }).eq("correo", profile.correo);
            }

            alert("Perfil actualizado correctamente.");
        } catch (error: any) {
            console.error("Error updating profile:", error);
            alert("Error al actualizar perfil: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil ({userRole === 'admin' ? "Administrador" : "Conductor"})</h2>
            
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-6 mb-8 border-b border-gray-100 pb-8">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center relative overflow-hidden group border border-gray-200">
                        {profile.fotodeperfil ? (
                            <img src={profile.fotodeperfil} alt="Foto de perfil" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-10 h-10 text-gray-400" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{profile.nombre || "Tu Nombre"}</h3>
                        <p className="text-gray-500 capitalize">{userRole}</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <User size={16} /> Nombre Completo
                            </label>
                            <input 
                                type="text" 
                                required
                                value={profile.nombre} 
                                onChange={e => setProfile({...profile, nombre: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Mail size={16} /> Correo Electrónico
                            </label>
                            <input 
                                type="email" 
                                disabled
                                value={profile.correo} 
                                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">El correo no puede modificarse. Contacta a soporte.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Phone size={16} /> Teléfono
                            </label>
                            <input 
                                type="text" 
                                value={profile.telefono} 
                                onChange={e => setProfile({...profile, telefono: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                placeholder="+52 123 456 7890"
                            />
                        </div>

                        {userRole === "conductor" && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <MapPin size={16} /> Dirección
                                </label>
                                <input 
                                    type="text" 
                                    value={profile.direccion} 
                                    onChange={e => setProfile({...profile, direccion: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="Avenida Reforma 123..."
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
