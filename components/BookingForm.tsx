"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, AlertCircle, Loader2, Navigation, MapPin, Calculator, Info, Banknote, CreditCard } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";
import { sendEmailAction } from "@/app/actions/email";
import { motion, AnimatePresence } from "framer-motion";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Dynamically import SearchBox to avoid SSR issues
const SearchBox = dynamic(
  () => import('@mapbox/search-js-react').then((mod) => mod.SearchBox),
  { ssr: false }
);

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface CategoryPricing {
  id: number;
  nombre: string;
  base_minima: number;
  base_precio_km: number;
  final_minima: number;
  final_precio_km: number;
}

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

export default function BookingForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const model = searchParams.get("model");
    const id = searchParams.get("id");

    const map = useRef<mapboxgl.Map | null>(null);
    const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);

    const [vehicleImage, setVehicleImage] = useState<string | null>(null);
    const [pricing, setPricing] = useState<CategoryPricing | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);

    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Coordinates state for distance calculation
    const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
    const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);
    const [minDateTime, setMinDateTime] = useState("");

    const [formData, setFormData] = useState({
        // Step 1
        schedule: "",
        bookerName: "",
        passengerPhone: "",
        bookerPhone: "",
        paymentMethod: "",
        // Step 2
        pickupAddress: "",
        pickupZip: "",
        pickupExtNum: "",
        pickupMunicipality: "",
        dropoffAddress: "",
        dropoffZip: "",
        dropoffMunicipality: "",
        // Step 3
        adults: 1,
        kids: 0,
        luggage10kg: 1,
        luggage25kg: 0,
        carryOn: 0,
        extraDestination: false,
        extraDestinationAddress: "",
        passengerPays: "no",
        bilingual: "no",
        email: "",
        extraSpecs: ""
    });

    useEffect(() => {
        const now = new Date();
        now.setHours(now.getHours() + 1); // Add 1 hour buffer

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const minFutureTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        setMinDateTime(minFutureTime);
        
        // Set default value for schedule
        setFormData(prev => ({
            ...prev,
            schedule: prev.schedule || minFutureTime
        }));

        if (id) {
            const fetchData = async () => {
                const { data: vehicle } = await supabase
                    .from('Vehículos')
                    .select('imagen, categoria_id, categorias_vehiculos(*)')
                    .eq('id', id)
                    .single();

                if (vehicle) {
                    if (vehicle.imagen) {
                        const img = vehicle.imagen;
                        setVehicleImage(img.includes("ejeturmex.com") || img.includes("taxiseguro.com") ? `/images/${img.split("/").pop()}` : img);
                    }
                    if (vehicle.categorias_vehiculos) {
                        setPricing(vehicle.categorias_vehiculos as any);
                    }
                }
            };
            fetchData();
        }
    }, [id]);

    // Initialize Map - using callback ref pattern for reliable initialization
    useEffect(() => {
        if (step < 2 || !mapContainer) {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
            return;
        }

        if (map.current) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;
        const newMap = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [-99.1332, 19.4326], // Default center
            zoom: 10,
            attributionControl: false
        });

        newMap.on('load', () => {
            map.current = newMap;
            if (pickupCoords && dropoffCoords) {
                updateRoute();
            }
        });

        return () => {
            newMap.remove();
            map.current = null;
        };
    }, [step, mapContainer]);

    const updateRoute = async () => {
        if (!pickupCoords || !dropoffCoords || !map.current) return;
        try {
            const query = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoords[0]},${pickupCoords[1]};${dropoffCoords[0]},${dropoffCoords[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
            );
            const json = await query.json();
            if (json.routes && json.routes[0]) {
                const data = json.routes[0];
                const route = data.geometry.coordinates;
                setDistance(data.distance / 1000);
                setDuration(data.duration / 60);

                const geojson: any = {
                    type: 'Feature',
                    properties: {},
                    geometry: { type: 'LineString', coordinates: route }
                };

                if (map.current.getSource('route')) {
                    (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData(geojson);
                } else {
                    map.current.addLayer({
                        id: 'route',
                        type: 'line',
                        source: { type: 'geojson', data: geojson },
                        layout: { 'line-join': 'round', 'line-cap': 'round' },
                        paint: { 'line-color': '#000', 'line-width': 5, 'line-opacity': 0.75 }
                    });
                }

                const bounds = new mapboxgl.LngLatBounds();
                bounds.extend(pickupCoords);
                bounds.extend(dropoffCoords);
                map.current.fitBounds(bounds, { padding: 50 });
            }
        } catch (err) {
            console.error("Error updating route:", err);
        }
    };

    // Update Route on Map when coordinates change
    useEffect(() => {
        if (pickupCoords && dropoffCoords && map.current) {
            updateRoute();
        }
    }, [pickupCoords, dropoffCoords]);

    // Clear error when step changes
    useEffect(() => {
        setError(null);
    }, [step]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (["passengerPhone", "bookerPhone", "pickupZip", "dropoffZip"].includes(name)) {
            if (value && !/^\d*$/.test(value)) return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCounter = (field: string, operation: "inc" | "dec") => {
        setFormData(prev => ({
            ...prev,
            // @ts-ignore
            [field]: operation === "inc" ? prev[field] + 1 : Math.max(0, prev[field] - 1)
        }));
    };

    const validateStep = (currentStep: number): boolean => {
        if (currentStep === 1) {
            if (!formData.schedule) { setError("Por favor selecciona un horario."); return false; }
            const selectedDate = new Date(formData.schedule);
            const minAllowed = new Date();
            minAllowed.setHours(minAllowed.getHours() + 1);
            
            if (selectedDate < minAllowed) { 
                setError("Por seguridad, las reservaciones deben hacerse con al menos 1 hora de anticipación."); 
                return false; 
            }
            if (!formData.bookerName) { setError("Por favor ingresa quien realiza la reservación."); return false; }
            if (!formData.passengerPhone) { setError("Por favor ingresa el teléfono del pasajero."); return false; }
            if (formData.passengerPhone.length < 10) { setError("El teléfono del pasajero debe tener al menos 10 dígitos."); return false; }
            if (!formData.bookerPhone) { setError("Por favor ingresa el teléfono de contacto."); return false; }
            if (formData.bookerPhone.length < 10) { setError("El teléfono de contacto debe tener al menos 10 dígitos."); return false; }
            if (!formData.paymentMethod) { setError("Por favor selecciona un método de pago."); return false; }
        }

        if (currentStep === 2) {
            if (!formData.pickupAddress) { setError("Por favor selecciona la dirección de recogida."); return false; }
            if (!formData.dropoffAddress) { setError("Por favor selecciona la dirección de destino."); return false; }
        }

        if (currentStep === 3) {
            if (formData.adults < 1) { setError("Debe haber al menos 1 adulto."); return false; }
            if (!formData.email) { setError("Por favor ingresa un correo electrónico."); return false; }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) { setError("Por favor ingresa un correo electrónico válido."); return false; }
        }

        return true;
    };

    const calculateEstimatedPrice = () => {
        if (!distance || !pricing) return null;
        const base = Math.max(pricing.base_minima, distance * pricing.base_precio_km);
        const final = Math.max(pricing.final_minima, distance * pricing.final_precio_km);
        return { base, final };
    };

    const currentEstimate = calculateEstimatedPrice();

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, 3));
        }
    };

    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        if (validateStep(step)) {
            setIsSubmitting(true);
            try {
                // Prepare insert data - removed distance_km if it's causing issues
                const insertData: any = {
                    vehicle_model: model || "No especificado",
                    vehicle_image: vehicleImage || "",
                    schedule: formData.schedule,
                    fechadesolicitud: formData.schedule,
                    distance_km: distance,
                    booker_name: formData.bookerName,
                    passenger_phone: formData.passengerPhone,
                    booker_phone: formData.bookerPhone,
                    zone_rate: currentEstimate ? currentEstimate.base.toString() : "0",
                    payment_method: formData.paymentMethod,
                    pickup_address: formData.pickupAddress,
                    pickup_zip: formData.pickupZip,
                    pickup_ext_num: formData.pickupExtNum,
                    pickup_municipality: formData.pickupMunicipality,
                    dropoff_address: formData.dropoffAddress,
                    dropoff_zip: formData.dropoffZip,
                    dropoff_municipality: formData.dropoffMunicipality,
                    adults: formData.adults,
                    kids: formData.kids,
                    luggage_10kg: formData.luggage10kg,
                    luggage_25kg: formData.luggage25kg,
                    carry_on: formData.carryOn,
                    extra_destination: formData.extraDestination,
                    extra_destination_address: formData.extraDestinationAddress,
                    passenger_pays: formData.passengerPays,
                    bilingual: formData.bilingual,
                    email: formData.email,
                    extra_specs: formData.extraSpecs
                };

                const { error: submitError } = await supabase.from('cotizaciones').insert(insertData);

                if (submitError) {
                    console.error("Supabase Error Detail:", submitError);
                    throw submitError;
                }

                await supabase.from('Notificaciones').insert({
                    tipo: 'formulario',
                    mensaje: `Nueva cotización de ${formData.bookerName} para ${model || 'un vehículo'}${currentEstimate ? ` (${formatCurrency(currentEstimate.base)})` : ''}`,
                });

                trackEvent("formulario");

                setIsSuccess(true);
            } catch (err: any) {
                console.error("Error submitting form complete:", err);
                setError(err.message || "No se concretó el envío. Verifica tu conexión.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-[600px] bg-white rounded-[36px] shadow-2xl overflow-hidden max-w-6xl mx-auto my-8 border border-neutral-200">
            {/* Form Section */}
            <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col">

                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-[#CCFF00] rounded-full flex items-center justify-center mb-6 shadow-md text-black font-bold">
                            <Check className="w-8 h-8 stroke-[3]" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-ui">Enviado exitosamente</h2>
                        <p className="text-gray-500 mb-8 font-body">
                            Hemos recibido tu reservación correctamente. Nos pondremos en contacto contigo a la brevedad.
                        </p>
                        <button
                            onClick={() => router.push("/")}
                            className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-neutral-800 transition-colors"
                        >
                            Volver al inicio
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Vehicle Selected Banner */}
                        {model && (
                            <div className="bg-neutral-100 border border-neutral-200 rounded-2xl p-3.5 mb-6 flex items-center justify-between">
                                <span className="text-sm text-gray-500 font-medium">Vehículo seleccionado:</span>
                                <span className="font-bold text-black">{model}</span>
                            </div>
                        )}

                        {/* Error Banner */}
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex-grow">
                            {step === 1 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h2 className="text-2xl font-bold mb-2 text-black">Datos Generales</h2>
                                    <p className="text-xs text-gray-400 mb-4">* Se calculará una estimación basada en la distancia.</p>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Horario de servicio</label>
                                            <input
                                                type="datetime-local"
                                                name="schedule"
                                                min={minDateTime}
                                                className="w-full p-4 border border-gray-200 rounded-full focus:outline-none focus:border-black transition-colors px-6"
                                                value={formData.schedule}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            name="bookerName"
                                            placeholder="Quien realiza la reservación"
                                            className="w-full p-4 border border-gray-200 rounded-full focus:outline-none focus:border-black transition-colors px-6"
                                            value={formData.bookerName}
                                            onChange={handleInputChange}
                                        />
                                        <input
                                            type="tel"
                                            name="passengerPhone"
                                            placeholder="Teléfono del pasajero a transportar"
                                            className="w-full p-4 border border-gray-200 rounded-full focus:outline-none focus:border-black transition-colors px-6"
                                            value={formData.passengerPhone}
                                            onChange={handleInputChange}
                                        />
                                        <input
                                            type="tel"
                                            name="bookerPhone"
                                            placeholder="Teléfono de quién realiza la reservación"
                                            className="w-full p-4 border border-gray-200 rounded-full focus:outline-none focus:border-black transition-colors px-6"
                                            value={formData.bookerPhone}
                                            onChange={handleInputChange}
                                        />
                                        <select
                                            name="paymentMethod"
                                            className="w-full p-4 border border-gray-200 rounded-full focus:outline-none focus:border-black transition-colors bg-white appearance-none px-6"
                                            value={formData.paymentMethod}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Metodo de pago</option>
                                            <option value="efectivo">Efectivo</option>
                                            <option value="tarjeta">Tarjeta (+iva)</option>
                                            <option value="transferencia">Transferencia</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex flex-col gap-4">
                                        <h2 className="text-xl font-bold text-black">Ubicación del Servicio</h2>
                                        
                                        {/* Pickup Search */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-3 tracking-widest">Punto de partida</label>
                                            <SearchBox
                                                accessToken={MAPBOX_TOKEN}
                                                options={{ language: 'es', country: 'MX' }}
                                                value={formData.pickupAddress}
                                                placeholder="Introduce lugar de recogida..."
                                                onRetrieve={(res: any) => {
                                                    const feat = res.features[0];
                                                    setPickupCoords(feat.geometry.coordinates);
                                                    setFormData(prev => ({ 
                                                        ...prev, 
                                                        pickupAddress: feat.properties.full_address || feat.properties.name,
                                                        pickupZip: feat.properties.postcode || "",
                                                        pickupMunicipality: feat.properties.place || ""
                                                    }));
                                                }}
                                                theme={{
                                                    variables: { borderRadius: '24px', colorBackground: '#f9f9f9', unit: '14px' }
                                                }}
                                            />
                                        </div>

                                        {/* Dropoff Search */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-3 tracking-widest">Punto de destino</label>
                                            <SearchBox
                                                accessToken={MAPBOX_TOKEN}
                                                options={{ language: 'es', country: 'MX' }}
                                                value={formData.dropoffAddress}
                                                placeholder="Introduce destino..."
                                                onRetrieve={(res: any) => {
                                                    const feat = res.features[0];
                                                    setDropoffCoords(feat.geometry.coordinates);
                                                    setFormData(prev => ({ 
                                                        ...prev, 
                                                        dropoffAddress: feat.properties.full_address || feat.properties.name,
                                                        dropoffZip: feat.properties.postcode || "",
                                                        dropoffMunicipality: feat.properties.place || ""
                                                    }));
                                                }}
                                                theme={{
                                                    variables: { borderRadius: '24px', colorBackground: '#f9f9f9', unit: '14px' }
                                                }}
                                            />
                                        </div>

                                        {/* Estimate Results - Moved context to sidebar briefly if desired, but keeping summary here is fine */}
                                        {distance && currentEstimate && (
                                            <div className="bg-black text-white p-6 rounded-3xl shadow-xl space-y-4 animate-in fade-in zoom-in-95">
                                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                                    <div>
                                                        <p className="text-[8px] uppercase font-bold text-white/40 mb-0.5">Precio Base (Efectivo)</p>
                                                        <p className="text-2xl font-black">{formatCurrency(currentEstimate.base)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] uppercase font-bold text-white/40 mb-0.5">Final con IVA incluido</p>
                                                        <p className="text-xl font-bold text-blue-400">{formatCurrency(currentEstimate.final)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Navigation className="w-3 h-3 text-blue-400" />
                                                    <p className="text-[10px] font-bold text-white">{distance.toFixed(1)} km <span className="opacity-40 font-normal">({Math.round(duration || 0)} min)</span></p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h2 className="text-xl font-bold mb-2 text-black">Adicionales</h2>

                                    {/* Counters */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl px-5">
                                            <span className="font-medium text-sm text-gray-700">Adultos</span>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleCounter("adults", "dec")} className="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 text-black shadow-sm">-</button>
                                                <span className="w-4 text-center font-bold text-black">{formData.adults}</span>
                                                <button onClick={() => handleCounter("adults", "inc")} className="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 text-black shadow-sm">+</button>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl px-5">
                                            <span className="font-medium text-sm text-gray-700">Niños</span>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleCounter("kids", "dec")} className="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 text-black shadow-sm">-</button>
                                                <span className="w-4 text-center font-bold text-black">{formData.kids}</span>
                                                <button onClick={() => handleCounter("kids", "inc")} className="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 text-black shadow-sm">+</button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="flex flex-col items-center bg-gray-50 p-3 rounded-2xl">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase mb-2">Equipaje 10kg</span>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => handleCounter("luggage10kg", "dec")} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 text-black shadow-sm text-xs">-</button>
                                                    <span className="w-4 text-center font-bold text-black text-sm">{formData.luggage10kg}</span>
                                                    <button onClick={() => handleCounter("luggage10kg", "inc")} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 text-black shadow-sm text-xs">+</button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center bg-gray-50 p-3 rounded-2xl">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase mb-2">Equipaje 25kg</span>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => handleCounter("luggage25kg", "dec")} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 text-black shadow-sm text-xs">-</button>
                                                    <span className="w-4 text-center font-bold text-black text-sm">{formData.luggage25kg}</span>
                                                    <button onClick={() => handleCounter("luggage25kg", "inc")} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 text-black shadow-sm text-xs">+</button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center bg-gray-50 p-3 rounded-2xl">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase mb-2">Carry on</span>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => handleCounter("carryOn", "dec")} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 text-black shadow-sm text-xs">-</button>
                                                    <span className="w-4 text-center font-bold text-black text-sm">{formData.carryOn}</span>
                                                    <button onClick={() => handleCounter("carryOn", "inc")} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 text-black shadow-sm text-xs">+</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-gray-100">
                                        <h3 className="font-bold text-black px-1 text-sm">Contacto y especificaciones</h3>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Correo electrónico"
                                            className="w-full p-4 border border-gray-200 rounded-full focus:outline-none focus:border-black transition-colors px-6 text-sm"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                        <textarea
                                            name="extraSpecs"
                                            placeholder="¿Alguna especificación adicional? (Opcional)"
                                            className="w-full p-5 border border-gray-200 rounded-3xl focus:outline-none focus:border-black transition-colors min-h-[100px] text-sm"
                                            value={formData.extraSpecs}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-8 border-t border-gray-100 pt-8">
                            <div className="flex justify-between items-center">
                                {step > 1 ? (
                                    <button
                                        onClick={prevStep}
                                        className="px-6 py-3 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
                                        disabled={isSubmitting}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Anterior
                                    </button>
                                ) : (
                                    <div />
                                )}

                                <div className="flex gap-2">
                                    {[1, 2, 3].map((s) => (
                                        <div key={s} className={`h-2 rounded-full transition-all duration-300 ${step === s ? "bg-[#CCFF00] w-6" : "bg-neutral-300 w-2"}`} />
                                    ))}
                                </div>

                                <button
                                    onClick={step === 3 ? handleSubmit : nextStep}
                                    disabled={isSubmitting}
                                    className={`px-8 py-3.5 rounded-full font-black transition-all flex items-center justify-center gap-2 min-w-[140px] shadow-lg ${isSubmitting ? "bg-neutral-300 text-neutral-600" : "bg-[#CCFF00] hover:bg-[#b8e600] text-black active:scale-95 text-sm"
                                        }`}
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                                    {step === 3 ? (isSubmitting ? "Procesando..." : "Finalizar") : "Continuar"}
                                    {step < 3 && !isSubmitting && <ChevronRight className="w-4 h-4 text-black" />}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Visual Section - Desktop Only (Moves between Image and Map) */}
            <div className="hidden lg:block w-1/2 relative bg-[#fafafa] overflow-hidden border-l border-gray-50">
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="vehicle-img"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full flex flex-col items-center justify-center p-16"
                        >
                            <div className="relative w-full h-full flex items-center justify-center">
                                <Image
                                    src={vehicleImage || "/images/pasajero-app-taxi.jpg"}
                                    alt={model || "Taxiseguro"}
                                    fill
                                    className={vehicleImage ? "object-contain p-12 drop-shadow-2xl" : "object-cover"}
                                    priority
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="route-map"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full relative"
                        >
                            <div ref={setMapContainer} className="absolute inset-0 w-full h-full" />
                            {distance && (
                                <div className="absolute top-8 right-8 bg-black p-5 rounded-3xl shadow-2xl border border-white/10 text-white min-w-[140px] z-10 animate-in fade-in slide-in-from-top-4">
                                     <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-2">Resumen Trayecto</p>
                                     <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                             <Navigation className="w-5 h-5 text-blue-400" />
                                         </div>
                                         <div>
                                             <p className="text-2xl font-black">{distance.toFixed(1)} <span className="text-[10px] font-normal opacity-50">KM</span></p>
                                             <p className="text-[10px] text-blue-400 font-bold">{Math.round(duration || 0)} MINUTOS</p>
                                         </div>
                                     </div>
                                </div>
                            )}
                            <div className="absolute bottom-8 left-8 right-8 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 z-10">
                                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white shrink-0">
                                    <MapPin size={16} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[9px] font-bold uppercase text-gray-400">Ruta sugerida</p>
                                    <p className="text-[10px] font-medium text-gray-700 truncate">{formData.pickupAddress || 'Selecciona origen'} → {formData.dropoffAddress || 'Selecciona destino'}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
