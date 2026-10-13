"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { 
    Loader2, User, Phone, MapPin, Mail, Lock, 
    ArrowRight, ArrowLeft, Car, FileText, 
    CheckCircle2, Upload, AlertCircle, X
} from "lucide-react";

type RegistrationStep = 1 | 2 | 3;

interface DocumentFile {
    file: File | null;
    name: string;
    label: string;
    required: boolean;
    url?: string;
    allowedFormat?: string;
    maxSizeMB?: number;
}

export default function LoginPage() {
    const router = useRouter();
    const [isRegistering, setIsRegistering] = useState(false);
    const [step, setStep] = useState<RegistrationStep>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1: Personal Data
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");

    // Step 2: Vehicle Data
    const [vehicleData, setVehicleData] = useState({
        marca: "",
        modelo: "",
        ano: "",
        color: "",
        placas: "",
        pasajeros: "5"
    });

    const [hasTriedStep3, setHasTriedStep3] = useState(false);

    // Step 3: Documents
    const [documents, setDocuments] = useState<DocumentFile[]>([
        { name: "licencia", label: "Licencia Vigente", required: true, file: null },
        { name: "ine", label: "INE", required: true, file: null },
        { name: "comprobante", label: "Comprobante de Domicilio", required: true, file: null, allowedFormat: "application/pdf", maxSizeMB: 1.2 },
        { name: "seguro", label: "Seguro de Taxi vigente", required: true, file: null, allowedFormat: "application/pdf", maxSizeMB: 1.2 },
        { name: "tarjeta", label: "Tarjeta de circulación", required: true, file: null },
        { name: "curp", label: "CURP", required: true, file: null, allowedFormat: "application/pdf", maxSizeMB: 1.2 },
        { name: "acta", label: "Acta de Nacimiento", required: true, file: null, allowedFormat: "application/pdf", maxSizeMB: 1.2 },
        { name: "alta", label: "Llenar y Firmar la alta", required: true, file: null, allowedFormat: "application/pdf", maxSizeMB: 1.2 },
        { name: "foto_vehiculo", label: "Fotografía del Vehículo", required: false, file: null },
    ]);

    // Redirect if already authenticated
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
                // 1. CHECK ROLES IN USERS TABLE (PRIORITY)
                const { data: userData } = await supabase
                    .from('users')
                    .select('isAdmin, isConductor')
                    .eq('correo', session.user.email)
                    .maybeSingle();

                if (userData?.isAdmin || session.user.user_metadata?.isAdmin) {
                    router.push("/dashboard");
                    return;
                }

                // 2. CHECK DRIVER COMPLETION (ONLY FOR NON-ADMINS)
                if (userData?.isConductor) {
                    const { data: conductor } = await supabase
                        .from('conductores')
                        .select('registro_status, marca, licencia_url, nombre, telefono, direccion')
                        .eq('correo', session.user.email)
                        .maybeSingle();

                    if (conductor && (!conductor.marca || !conductor.licencia_url)) {
                        // Force completion for incomplete driver profiles
                        setIsRegistering(true);
                        setNombre(conductor.nombre || "");
                        setTelefono(conductor.telefono || "");
                        setDireccion(conductor.direccion || "");
                        setEmail(session.user.email || "");
                        setStep(conductor.marca ? 3 : 2);
                        return;
                    } else if (conductor && conductor.registro_status === 'approved') {
                        router.push("/dashboard");
                        return;
                    }
                }
            }
        };
        checkAuth();
    }, [router]);

    const handleFileChange = (index: number, file: File | null) => {
        if (file) {
            const doc = documents[index];
            
            // Validate Format
            if (doc.allowedFormat && file.type !== doc.allowedFormat) {
                setError(`El documento "${doc.label}" debe estar en formato PDF.`);
                return;
            }

            // Validate Size
            if (doc.maxSizeMB && file.size > doc.maxSizeMB * 1024 * 1024) {
                setError(`El documento "${doc.label}" supera el límite de ${doc.maxSizeMB}MB.`);
                return;
            }
        }

        setError(null);
        const newDocs = [...documents];
        newDocs[index].file = file;
        setDocuments(newDocs);
    };

    const nextStep = () => {
        if (step === 1) {
            if (!nombre || !telefono || !direccion || !email || !password) {
                setError("Por favor completa todos los campos personales.");
                return;
            }
        } else if (step === 2) {
            if (!vehicleData.marca || !vehicleData.modelo || !vehicleData.ano || !vehicleData.placas || !vehicleData.color || !vehicleData.pasajeros) {
                setError("Por favor completa todos los datos del vehículo.");
                return;
            }
        }
        setError(null);
        if (step + 1 === 3) setHasTriedStep3(false);
        setStep((s) => (s + 1) as RegistrationStep);
    };

    const prevStep = () => {
        setError(null);
        setStep((s) => (s - 1) as RegistrationStep);
    };

    const uploadDocument = async (doc: DocumentFile, driverEmail: string) => {
        if (!doc.file) return null;
        const fileExt = doc.file.name.split('.').pop();
        const fileName = `${driverEmail}/${doc.name}_${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
            .from('conductor-docs')
            .upload(fileName, doc.file);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
            .from('conductor-docs')
            .getPublicUrl(data.path);
            
        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isRegistering) {
                if (step < 3) {
                    nextStep();
                    setLoading(false);
                    return;
                }

                // Final Validation for Step 3
                const missingRequired = documents.filter(d => d.required && !d.file);
                if (missingRequired.length > 0) {
                    setHasTriedStep3(true);
                    setError(`Faltan documentos obligatorios: ${missingRequired.map(d => d.label).join(", ")}`);
                    setLoading(false);
                    return;
                }

                // Registration Logic
                const correoLimpio = email.trim().toLowerCase();
                const nombreLimpio = nombre.trim();
                
                // 1. Auth Sign Up (only if not already in Auth)
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                let currentEmail = correoLimpio;
                
                if (!currentUser) {
                    const { data: authData, error: authError } = await supabase.auth.signUp({
                        email: correoLimpio,
                        password: password,
                        options: {
                            data: {
                                nombre: nombreLimpio,
                                full_name: nombreLimpio,
                                isConductor: true,
                                isAdmin: false
                            }
                        }
                    });
                    
                    if (authError) {
                        // Si el error es que ya existe, intentamos continuar si es posible
                        if (authError.message.includes("already registered") || authError.message.includes("Database error")) {
                            console.log("Continuando a pesar de error de registro (posible usuario existente o trigger):", authError.message);
                        } else {
                            throw authError;
                        }
                    }
                    if (authData?.user) currentEmail = authData.user.email || correoLimpio;
                } else {
                    currentEmail = currentUser.email || correoLimpio;
                }

                // 2. Upload Documents
                const uploadedUrls: Record<string, string> = {};
                for (const doc of documents) {
                    if (doc.file) {
                        try {
                            const url = await uploadDocument(doc, currentEmail);
                            if (url) uploadedUrls[`${doc.name}_url`] = url;
                        } catch (uploadErr: any) {
                            if (uploadErr.message?.includes('Bucket not found')) {
                                throw new Error('Error de configuración: El bucket "conductor-docs" no existe en Supabase Storage. Por favor créalo para continuar.');
                            }
                            throw uploadErr;
                        }
                    }
                }

                // 3. Upsert into conductores and get ID
                const { data: conductorData, error: conductorError } = await supabase
                    .from('conductores')
                    .upsert([{
                        nombre: nombreLimpio,
                        direccion: direccion.trim(),
                        telefono: telefono.trim(),
                        correo: currentEmail,
                        contrasena: password,
                        marca: vehicleData.marca,
                        modelo: vehicleData.modelo,
                        ano: vehicleData.ano,
                        color: vehicleData.color,
                        placas: vehicleData.placas,
                        puertas: vehicleData.pasajeros,
                        licencia_url: uploadedUrls.licencia_url,
                        ine_url: uploadedUrls.ine_url,
                        comprobante_url: uploadedUrls.comprobante_url,
                        seguro_url: uploadedUrls.seguro_url,
                        tarjeta_url: uploadedUrls.tarjeta_url,
                        curp_url: uploadedUrls.curp_url,
                        acta_url: uploadedUrls.acta_url,
                        alta_firmada_url: uploadedUrls.alta_url,
                        registro_status: 'pending'
                    }], { onConflict: 'correo' })
                    .select('id')
                    .single();

                if (conductorError) throw conductorError;

                // 3.1 Create and link vehicle in "Vehículos" table
                if (conductorData) {
                    const { error: vehicleError } = await supabase.from('Vehículos').insert({
                        Modelo: vehicleData.modelo,
                        marca: vehicleData.marca,
                        año: vehicleData.ano ? parseInt(vehicleData.ano) : null,
                        color: vehicleData.color,
                        placas: vehicleData.placas,
                        capacidadDeCarga: vehicleData.pasajeros ? parseInt(vehicleData.pasajeros) : 5,
                        conductor_id: conductorData.id,
                        imagen: uploadedUrls.foto_vehiculo_url || null,
                        VerEnWeb: false,
                        Disponibilidad: true,
                        categoria_id: 1 // Default to Sedán/General for new registrations
                    });

                    if (vehicleError) {
                        console.error("Error al crear el vehículo:", vehicleError);
                        // We don't throw here to not block the whole registration if only the vehicle link failed,
                        // but we should at least notify or log it better.
                    }
                }


                // 4. Upsert into users
                await supabase
                    .from('users')
                    .upsert([{
                        nombre: nombreLimpio,
                        correo: currentEmail,
                        telefono: telefono.trim(),
                        isConductor: true,
                        isAdmin: false
                    }], { onConflict: 'correo' });

                alert("¡Petición enviada con éxito! Revisaremos tu documentación y te avisaremos.");
                setIsRegistering(false);
                setStep(1);
                setLoading(false);
            } else {
                // Login Logic
                const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (authErr) {
                    setError(authErr.message === "Invalid login credentials" ? "Credenciales inválidas" : authErr.message);
                    setLoading(false);
                    return;
                }

                // 1. CHECK ROLES IN USERS TABLE (PRIORITY)
                const { data: userData } = await supabase
                    .from('users')
                    .select('isAdmin, isConductor')
                    .eq('correo', email.trim().toLowerCase())
                    .maybeSingle();

                if (userData?.isAdmin || authData.user?.user_metadata?.isAdmin) {
                    router.push("/dashboard");
                    return;
                }

                // 2. IF NOT ADMIN, CHECK DRIVER STATUS
                if (!userData?.isConductor) {
                    // It's a user but not a conductor/admin yet
                    setIsRegistering(true);
                    setStep(1);
                    setNombre(authData.user?.user_metadata?.full_name || "");
                    setLoading(false);
                    return;
                }
                // 3. FETCH CONDUCTOR STATUS
                const { data: conductor } = await supabase
                    .from('conductores')
                    .select('*')
                    .eq('correo', email.trim().toLowerCase())
                    .maybeSingle();

                if (!conductor) {
                    setError("No se encontró perfil de conductor asociado.");
                    setLoading(false);
                    return;
                }

                if (!conductor.marca || !conductor.licencia_url) {
                    setError("Tu registro está incompleto. Por favor completa los datos de tu vehículo y documentos.");
                    setNombre(conductor.nombre || "");
                    setTelefono(conductor.telefono || "");
                    setDireccion(conductor.direccion || "");
                    setIsRegistering(true);
                    setStep(2); 
                    setLoading(false);
                    return;
                }

                if (conductor.registro_status === 'pending') {
                    setError("Tu cuenta está en revisión. Te avisaremos cuando sea aprobada.");
                    setLoading(false);
                    return;
                }

                // If approved, go to dashboard
                router.push("/dashboard");
            }
        } catch (err: any) {
            console.error('Error detallado en el registro:', err);
            
            // Extraer mensaje de error de forma más robusta
            let errorMessage = "Ocurrió un error inesperado.";
            
            if (err.message) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            } else if (err.error_description) {
                errorMessage = err.error_description;
            } else if (err.code) {
                errorMessage = `Error (${err.code}): ${err.message || 'Sin mensaje'}`;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] px-4 py-12">
            <div className={`max-w-md w-full transition-all duration-500 ${isRegistering ? 'max-w-xl' : 'max-w-md'}`}>
                <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-[0_25px_60px_rgba(0,0,0,0.06)] border border-gray-100 relative overflow-hidden">
                    
                    {/* Progress Bar for Registration */}
                    {isRegistering && (
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-50 flex">
                            <div className={`h-full bg-black transition-all duration-500 ease-out ${step >= 1 ? 'w-1/3' : 'w-0'}`} />
                            <div className={`h-full bg-black transition-all duration-500 ease-out ${step >= 2 ? 'w-1/3' : 'w-0'}`} />
                            <div className={`h-full bg-black transition-all duration-500 ease-out ${step >= 3 ? 'w-1/3' : 'w-0'}`} />
                        </div>
                    )}

                    <div className="flex flex-col items-center mb-10">
                        <div className="relative w-40 h-20 mb-6 transform hover:scale-105 transition-transform duration-500">
                            <Image
                                src="/images/logonormal.png"
                                alt="Taxiseguro"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight text-center">
                            {isRegistering ? (
                                step === 1 ? "Únete a Taxiseguro" : 
                                step === 2 ? "Datos del Vehículo" : 
                                "Documentación"
                            ) : "Bienvenido de nuevo"}
                        </h1>
                        <p className="text-gray-400 text-sm mt-3 font-medium text-center">
                            {isRegistering 
                                ? (step === 1 ? "Empieza con tus datos personales" : 
                                   step === 2 ? "Cuéntanos sobre tu herramienta de trabajo" : 
                                   "Sube tus documentos para validar tu cuenta")
                                : "Ingresa tus credenciales para acceder a la plataforma"}
                        </p>
                    </div>

                    {error && (!isRegistering || (step === 3 ? hasTriedStep3 : true)) && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border border-red-100 mb-8 animate-in fade-in zoom-in duration-300">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {isRegistering ? (
                            <>
                                {/* STEP 1: PERSONAL */}
                                {step === 1 && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><User size={18} /></div>
                                                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all text-sm font-medium" placeholder="Juan Pérez" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Phone size={18} /></div>
                                                <input type="tel" value={telefono} onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setTelefono(val);
                                                }} required className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all text-sm font-medium" placeholder="8110000000" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dirección</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><MapPin size={18} /></div>
                                                <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} required className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all text-sm font-medium" placeholder="Colonia, Ciudad" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Mail size={18} /></div>
                                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all text-sm font-medium" placeholder="nombre@correo.com" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Lock size={18} /></div>
                                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all text-sm font-medium" placeholder="••••••••" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: VEHICLE */}
                                {step === 2 && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Marca</label>
                                                <input type="text" value={vehicleData.marca} onChange={(e) => setVehicleData({...vehicleData, marca: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm font-medium" placeholder="Nissan" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Modelo</label>
                                                <input type="text" value={vehicleData.modelo} onChange={(e) => setVehicleData({...vehicleData, modelo: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm font-medium" placeholder="Versa" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Año</label>
                                                <input type="text" value={vehicleData.ano} onChange={(e) => setVehicleData({...vehicleData, ano: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm font-medium" placeholder="2024" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Color</label>
                                                <input type="text" value={vehicleData.color} onChange={(e) => setVehicleData({...vehicleData, color: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm font-medium" placeholder="Blanco" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Placas</label>
                                                <input type="text" value={vehicleData.placas} onChange={(e) => setVehicleData({...vehicleData, placas: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm font-medium" placeholder="ABC-123" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pasajeros</label>
                                                <input type="text" value={vehicleData.pasajeros} onChange={(e) => setVehicleData({...vehicleData, pasajeros: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all text-sm font-medium" placeholder="5 Pasajeros" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: DOCUMENTS */}
                                {step === 3 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-4">
                                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                                                <AlertCircle size={14} /> Importante
                                            </p>
                                            <p className="text-[11px] text-amber-800 mt-1 leading-relaxed font-medium">
                                                Los documentos marcados con <span className="font-bold">PDF</span> deben subirse exclusivamente en ese formato y no superar los <span className="font-bold">1.2MB</span> de tamaño.
                                            </p>
                                        </div>

                                        {documents.map((doc, idx) => {
                                            const isMissing = hasTriedStep3 && error?.includes(doc.label) && doc.required && !doc.file;
                                            return (
                                                <div key={doc.name} className={`p-4 rounded-2xl border transition-all ${doc.file ? 'bg-green-50 border-green-200' : (isMissing ? 'bg-red-50 border-red-300 ring-2 ring-red-100' : 'bg-gray-50 border-gray-100 hover:border-gray-200')}`}>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-xl ${doc.file ? 'bg-green-500 text-white' : isMissing ? 'bg-red-500 text-white' : 'bg-white text-gray-400 shadow-sm'}`}>
                                                                {doc.file ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                                                            </div>
                                                            <div>
                                                                <p className={`text-xs font-bold ${isMissing ? 'text-red-700' : 'text-gray-800'}`}>{doc.label}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${doc.required ? (isMissing ? 'text-red-500' : 'text-red-400') : 'text-gray-400'}`}>
                                                                        {doc.required ? (isMissing ? "¡FALTA ESTE DOCUMENTO!" : "Es obligatorio") : "Opcional"}
                                                                    </p>
                                                                    {doc.allowedFormat === 'application/pdf' && (
                                                                        <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black">PDF / MAX 1.2MB</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <label className="relative cursor-pointer group">
                                                            <input 
                                                                type="file" 
                                                                className="hidden" 
                                                                onChange={(e) => handleFileChange(idx, e.target.files?.[0] || null)} 
                                                                accept={doc.allowedFormat === 'application/pdf' ? 'application/pdf' : 'image/*,application/pdf'} 
                                                            />
                                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${doc.file ? 'bg-white text-green-600 shadow-sm' : 'bg-black text-white'}`}>
                                                                {doc.file ? "CAMBIAR" : <><Upload size={12} /> SUBIR</>}
                                                            </div>
                                                        </label>
                                                    </div>
                                                    {doc.file && (
                                                        <div className="mt-2 flex items-center justify-between bg-white/50 px-3 py-1.5 rounded-lg border border-green-100">
                                                            <span className="text-[10px] text-green-700 font-medium truncate max-w-[200px]">{doc.file.name}</span>
                                                            <button type="button" onClick={() => handleFileChange(idx, null)} className="text-green-700 hover:text-red-500 transition-colors"><X size={12} /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="flex gap-4 mt-8">
                                    {step > 1 && (
                                        <button type="button" onClick={prevStep} className="flex-grow bg-gray-100 text-gray-600 font-black py-4 px-6 rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                                            <ArrowLeft size={18} /> ATRÁS
                                        </button>
                                    )}
                                    <button
                                        type={step === 3 ? "submit" : "button"}
                                        onClick={step === 3 ? undefined : nextStep}
                                        disabled={loading}
                                        className="flex-[2] bg-black text-white font-black py-4 px-6 rounded-2xl hover:bg-gray-800 transition-all flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.1)] active:scale-[0.98] group"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                {step === 3 ? "FINALIZAR REGISTRO" : "CONTINUAR"}
                                                {step < 3 && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* LOGIN FORM */
                            <>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Mail size={18} /></div>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all text-sm font-medium" placeholder="nombre@correo.com" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Lock size={18} /></div>
                                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all text-sm font-medium" placeholder="••••••••" />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-black text-white font-black py-4 px-6 rounded-2xl hover:bg-gray-800 transition-all flex items-center justify-center disabled:opacity-50 shadow-[0_10px_30px_rgba(0,0,0,0.1)] active:scale-[0.98] mt-6 group">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2">Iniciar Sesión <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></span>}
                                </button>
                            </>
                        )}
                    </form>

                    <div className="mt-10 pt-8 border-t border-gray-50 text-center">
                        <button 
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setStep(1);
                                setError(null);
                            }}
                            className="text-sm font-bold text-gray-400 hover:text-black transition-colors"
                        >
                            {isRegistering ? "¿Ya tienes una cuenta? Inicia sesión" : "¿Quieres ser conductor? Regístrate aquí"}
                        </button>
                    </div>
                </div>
                
                <p className="mt-8 text-center text-xs text-gray-300 font-medium tracking-wide">
                    &copy; 2026 Taxiseguro Servicios Ejecutivos. Todos los derechos reservados.
                </p>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ddd; }
            `}</style>
        </main>
    );
}


