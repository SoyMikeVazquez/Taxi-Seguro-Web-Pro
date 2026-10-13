"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, Calendar, MapPin, Phone, Mail, User, Info, AlertCircle, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return "$0.00";
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(val)) return "$0.00";
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val);
};

export default function ConsultaPage() {
    const [identifier, setIdentifier] = useState("");
    const [searchType, setSearchType] = useState<"email" | "phone">("email");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier.trim()) return;

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const cleanedId = identifier.trim();

            let contactosQuery = supabase.from('cotizaciones').select('*');
            let confirmedQuery = supabase.from('viajes_confirmados').select('*');

            if (searchType === "email") {
                contactosQuery = contactosQuery.eq('email', cleanedId);
                confirmedQuery = confirmedQuery.eq('email', cleanedId);
            } else {
                contactosQuery = contactosQuery.or(`booker_phone.eq.${cleanedId},passenger_phone.eq.${cleanedId}`);
                confirmedQuery = confirmedQuery.or(`booker_phone.eq.${cleanedId},passenger_phone.eq.${cleanedId}`);
            }

            const [contactosRes, confirmedRes] = await Promise.all([
                contactosQuery.order('created_at', { ascending: false }),
                confirmedQuery.order('schedule', { ascending: false })
            ]);

            const allResults: any[] = [
                ...(confirmedRes.data || []).map(v => ({ ...v, type: 'confirmed' })),
                ...(contactosRes.data || [])
                    .filter(c => !confirmedRes.data?.some(v => v.cotizacion_id === c.id))
                    .map(c => ({ ...c, type: 'quote' }))
            ];

            allResults.sort((a, b) => {
                const dateA = new Date(a.schedule || a.created_at).getTime();
                const dateB = new Date(b.schedule || b.created_at).getTime();
                return dateB - dateA;
            });

            if (allResults.length === 0) {
                setError("No se encontraron registros con esos datos. Intenta con tu otro correo o teléfono.");
            } else {
                setResults(allResults);
            }
        } catch (err) {
            console.error("Search error:", err);
            setError("Ocurrió un error al realizar la búsqueda. Por favor intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="bg-gray-50 min-h-screen flex flex-col font-body">
            <Header />

            {/* Spacer for fixed header */}
            <div className="h-24 md:h-32"></div>

            <section className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-4xl">
                <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <h1 className="text-3xl md:text-5xl font-black text-black mb-4 tracking-tight">Consulta tus Reservas</h1>
                    <p className="text-gray-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
                        Accede al historial y estatus de tus servicios de transporte ejecutivo.
                    </p>
                </div>

                {/* Search Box */}
                <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 mb-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-black/[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                    
                    {/* Search Type Selector */}
                    <div className="flex justify-center mb-8 relative z-10">
                        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full max-w-xs transition-all border border-gray-200/50">
                            <button
                                onClick={() => {
                                    setSearchType("email");
                                    setError(null);
                                }}
                                className={`flex-1 py-3 px-6 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${searchType === "email" ? "bg-white text-black shadow-xl shadow-black/5 ring-1 ring-black/5" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                <Mail size={16} className={searchType === "email" ? "text-blue-500" : ""} /> Correo
                            </button>
                            <button
                                onClick={() => {
                                    setSearchType("phone");
                                    setError(null);
                                }}
                                className={`flex-1 py-3 px-6 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${searchType === "phone" ? "bg-white text-black shadow-xl shadow-black/5 ring-1 ring-black/5" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                <Phone size={16} className={searchType === "phone" ? "text-green-500" : ""} /> Teléfono
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 relative z-10">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                {searchType === "email" ? (
                                    <Mail className="text-gray-400 w-5 h-5 focus-within:text-black transition-colors" />
                                ) : (
                                    <Phone className="text-gray-400 w-5 h-5 focus-within:text-black transition-colors" />
                                )}
                            </div>
                            <input
                                type={searchType === "email" ? "email" : "tel"}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder={searchType === "email" ? "ejemplo@correo.com" : "10 dígitos sin espacios..."}
                                className="w-full pl-16 pr-6 py-5 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black/10 transition-all text-gray-900 font-medium placeholder:text-gray-400 shadow-inner"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !identifier.trim()}
                            className="bg-black text-white px-10 py-5 rounded-2xl font-bold hover:shadow-xl hover:shadow-black/10 active:scale-95 transition-all disabled:bg-gray-300 flex items-center justify-center gap-3 min-w-[180px]"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <Search className="w-5 h-5" />
                                    Buscar
                                </>
                            )}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-8 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="font-bold">Sin resultados</p>
                                <p className="opacity-80">{error}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {results && (
                        <div className="flex items-center justify-between mb-2 px-2">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Registros encontrados ({results.length})</h2>
                        </div>
                    )}
                    
                    {results && results.map((item, idx) => (
                        <div 
                            key={idx} 
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-black/[0.02] transition-all animate-in fade-in slide-in-from-bottom-4 duration-500"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="p-6 md:p-10">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-8 border-b border-gray-50">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.type === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {item.type === 'confirmed' ? <CheckCircle2 className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${item.type === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {item.type === 'confirmed' ? 'Confirmado' : 'Cotización'}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{item.vehicle_model}</h3>
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Fecha de servicio</p>
                                        <p className="text-md font-black text-gray-900">
                                            {format(new Date(item.schedule || item.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                                        </p>
                                        <p className="text-sm font-bold text-blue-600 capitalize">
                                            {format(new Date(item.schedule || item.created_at), "p", { locale: es })}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100">
                                                <MapPin size={18} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">RECOGIDA</p>
                                                <p className="text-sm font-bold text-gray-800 leading-snug">
                                                    {item.pickup_address} {item.pickup_ext_num || ""}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 relative">
                                            <div className="absolute top-[-30px] left-[19px] w-0.5 h-6 bg-gradient-to-b from-gray-100 to-blue-100" />
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 border border-blue-100">
                                                <MapPin size={18} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">DESTINO</p>
                                                <p className="text-sm font-bold text-gray-800 leading-snug">
                                                    {item.dropoff_address}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">PAGO ESTIMADO</p>
                                            <p className="text-3xl font-black text-gray-900">{formatCurrency(item.zone_rate)}</p>
                                            <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase">{item.payment_method}</p>
                                        </div>
                                        <div className="bg-black text-white p-6 rounded-[1.5rem] flex flex-col justify-center">
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-2">PASAJEROS</p>
                                            <div className="flex items-end gap-1">
                                                <span className="text-3xl font-black">{Number(item.adults || 0) + Number(item.kids || 0)}</span>
                                                <span className="text-xs font-bold opacity-40 mb-1.5 px-1">PAX</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {item.type === 'confirmed' ? (
                                    <div className="mt-10 p-5 bg-green-50/50 rounded-2xl border border-green-100/50 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                            <Info className="text-green-600 w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-green-900">Servicio Confirmado</p>
                                            <p className="text-xs text-green-700 opacity-80">
                                                Tu conductor se pondrá en contacto contigo minutos antes del servicio en el teléfono registrado.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-10 p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                            <Clock className="text-blue-600 w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-blue-900">En revisión</p>
                                            <p className="text-xs text-blue-700 opacity-80">
                                                Estamos procesando tu solicitud. Recibirás una confirmación vía WhatsApp o correo electrónico pronto.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {!results && !loading && (
                        <div className="text-center py-20 opacity-20">
                            <Calendar size={80} className="mx-auto mb-4" />
                            <p className="font-bold">Realiza una búsqueda para ver tu historial</p>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
