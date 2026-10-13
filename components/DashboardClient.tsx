"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { 
    Calendar, ChevronRight, Loader2, MapPin, Phone, Mail, User, Car, 
    BarChart3, TrendingUp, MousePointerClick, FileText, Globe, 
    Bell, CheckCheck, Filter, Receipt, XCircle, X, Info, ArrowUpRight, ArrowRight, 
    Users, ExternalLink, Plus, Navigation, Package, Languages, Eye, EyeOff
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import TripsBoard from "./TripsBoard";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

function QuotationMap({ pickup, dropoff }: { pickup: string, dropoff: string }) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);

    useEffect(() => {
        if (!mapContainer.current || !pickup || !dropoff) return;
        
        mapboxgl.accessToken = MAPBOX_TOKEN;
        const newMap = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            zoom: 10,
            attributionControl: false,
            interactive: true
        });

        const loadRoute = async () => {
            try {
                // Geocode Pickup
                const pRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(pickup)}.json?access_token=${MAPBOX_TOKEN}`);
                const pData = await pRes.json();
                const pickupCoords = pData.features?.[0]?.center;

                // Geocode Dropoff
                const dRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(dropoff)}.json?access_token=${MAPBOX_TOKEN}`);
                const dData = await dRes.json();
                const dropoffCoords = dData.features?.[0]?.center;

                if (pickupCoords && dropoffCoords) {
                    newMap.setCenter(pickupCoords);
                    
                    const query = await fetch(
                        `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoords[0]},${pickupCoords[1]};${dropoffCoords[0]},${dropoffCoords[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
                    );
                    const json = await query.json();
                    if (json.routes && json.routes[0]) {
                        const data = json.routes[0];
                        const route = data.geometry.coordinates;

                        newMap.addLayer({
                            id: 'route',
                            type: 'line',
                            source: { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: route }, properties: {} } },
                            layout: { 'line-join': 'round', 'line-cap': 'round' },
                            paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 0.8 }
                        });

                        newMap.addLayer({
                             id: 'points',
                             type: 'circle',
                             source: {
                                 type: 'geojson',
                                 data: {
                                     type: 'FeatureCollection',
                                      features: [
                                          { type: 'Feature', geometry: { type: 'Point', coordinates: pickupCoords }, properties: {} },
                                          { type: 'Feature', geometry: { type: 'Point', coordinates: dropoffCoords }, properties: {} }
                                      ]
                                 }
                             },
                             paint: { 'circle-radius': 6, 'circle-color': '#000', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' }
                        });

                        const bounds = new mapboxgl.LngLatBounds();
                        bounds.extend(pickupCoords);
                        bounds.extend(dropoffCoords);
                        newMap.fitBounds(bounds, { padding: 40 });
                    }
                }
            } catch (e) {
                console.error("Map load error", e);
            }
        };

        newMap.on('load', loadRoute);
        map.current = newMap;

        return () => {
            newMap.remove();
            map.current = null;
        };
    }, [pickup, dropoff]);

    return (
        <div className="w-full h-48 md:h-full bg-gray-100 rounded-2xl overflow-hidden relative border border-gray-200 shadow-inner">
             <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
             <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[9px] font-bold text-gray-500 shadow-sm border border-gray-100 uppercase tracking-widest z-10 flex items-center gap-1.5">
                <Navigation size={10} className="text-blue-500" /> Trayectoria Sugerida
             </div>
        </div>
    );
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

export default function DashboardClient({ initialSection = "overview" }: { initialSection?: "overview" | "contacts" | "invoices" | "drivers" | "trips" }) {
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string>(initialSection);
    
    // Sync if prop changes (sidebar navigation)
    useEffect(() => {
        setActiveSection(initialSection);
    }, [initialSection]);
    const [activeTab, setActiveTab] = useState<string>("pending");
    const getInitialDates = () => {
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + 7);
        
        const formatDate = (d: Date) => {
            const z = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - z).toISOString().split('T')[0];
        };
        
        return { start: formatDate(start), end: formatDate(end) };
    };
    
    const [startDate, setStartDate] = useState<string>(getInitialDates().start);
    const [endDate, setEndDate] = useState<string>(getInitialDates().end);
    const [sortBy, setSortBy] = useState<string>("created_at");
    const [isConductor, setIsConductor] = useState(false);
    const [driverProfile, setDriverProfile] = useState<any>(null);
    const [viajesDriver, setViajesDriver] = useState<any[]>([]);
    const [adminActiveTrips, setAdminActiveTrips] = useState<any[]>([]);

    // Data states
    const [contacts, setContacts] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [uniqueVisitors, setUniqueVisitors] = useState<number>(0);
    const [eventStats, setEventStats] = useState({ visita: 0, contacto: 0, formulario: 0 });
    const [drivers, setDrivers] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    
    const [newDriver, setNewDriver] = useState({
        nombre: "",
        direccion: "",
        telefono: "",
        correo: "",
        contrasena: "",
        marca: "",
        modelo: "",
        ano: "",
        color: "",
        placas: "",
        puertas: "5",
        foto_file: null as File | null
    });
    const [isSavingDriver, setIsSavingDriver] = useState(false);
    
    // Edit Driver State
    const [editingDriver, setEditingDriver] = useState<any | null>(null);
    const [editDriverForm, setEditDriverForm] = useState({
        nombre: "",
        direccion: "",
        telefono: "",
        correo: "",
        nuevaContrasena: "",
        marca: "",
        modelo: "",
        ano: "",
        color: "",
        placas: "",
        puertas: "4"
    });
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isDeletingDriver, setIsDeletingDriver] = useState<string | null>(null);

    // Edit Contact State
    const [editingContact, setEditingContact] = useState<any | null>(null);
    const [editContactForm, setEditContactForm] = useState({
        booker_name: "",
        booker_phone: "",
        email: "",
        zone_rate: "",
        vehicle_model: ""
    });
    const [isSavingContactEdit, setIsSavingContactEdit] = useState(false);
    const [isDeletingContact, setIsDeletingContact] = useState<string | null>(null);
    
    // Notification states
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    
    // UI states
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [selectedDrivers, setSelectedDrivers] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);
    const [driverTab, setDriverTab] = useState<"active" | "pending">("active");
    const [selectedDriverDocs, setSelectedDriverDocs] = useState<any | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                try {
                    const { data: userData } = await supabase.from('users').select('isAdmin, isConductor').eq('correo', user.email).single();
                    if (userData?.isAdmin) {
                        setIsConductor(false);
                        const { data: allActiveViajes } = await supabase.from('viajes_confirmados')
                                .select('*, conductores(nombre)')
                                .neq('status', 'finalizado')
                                .order('schedule', { ascending: true });
                        setAdminActiveTrips(allActiveViajes || []);
                    } else if (userData?.isConductor) {
                        setIsConductor(true);
                        if (initialSection === "overview") setActiveSection("trips");
                        const { data: driverInfo } = await supabase.from('conductores').select('*').eq('correo', user.email).single();
                        if (driverInfo) {
                            setDriverProfile(driverInfo);
                            const { data: myViajes } = await supabase.from('viajes_confirmados')
                                .select('*')
                                .eq('conductor_id', driverInfo.id)
                                .gte('schedule', `${startDate}T00:00:00`)
                                .lte('schedule', `${endDate}T23:59:59`)
                                .order('schedule', { ascending: true });
                            setViajesDriver(myViajes || []);
                        }
                    }

                } catch (err) {}
            }

            const [contactsResult, vehiclesResult, visitorsResult, eventsResult, invoicesResult, notifsResult, driversResult, categoriesResult] = await Promise.all([
                supabase
                    .from('cotizaciones')
                    .select('*')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('Vehículos')
                    .select('*, categorias_vehiculos(nombre)'),
                supabase
                    .from('unique_visitors')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', `${startDate}T00:00:00Z`)
                    .lte('created_at', `${endDate}T23:59:59Z`),
                supabase
                    .from('eventos')
                    .select('nombre, created_at')
                    .gte('created_at', `${startDate}T00:00:00Z`)
                    .lte('created_at', `${endDate}T23:59:59Z`),
                supabase
                    .from('facturacion')
                    .select('*')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('Notificaciones')
                    .select('*')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('conductores')
                    .select('*')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('categorias_vehiculos')
                    .select('*')
                    .order('nombre')
            ]);

            setContacts(contactsResult.data || []);
            setVehicles(vehiclesResult.data || []);
            setInvoices(invoicesResult.data || []);
            setNotifications(notifsResult.data || []);
            setDrivers(driversResult.data || []);
            setCategories(categoriesResult.data || []);
            setUniqueVisitors(visitorsResult.count || 0);

            const stats = { visita: 0, contacto: 0, formulario: 0 };
            eventsResult.data?.forEach(e => {
                if (e.nombre in stats) {
                    // @ts-ignore
                    stats[e.nombre]++;
                }
            });
            setEventStats(stats);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        // Polling for notifications every 30 seconds
        const interval = setInterval(() => {
            fetchNotificationsOnly();
        }, 30000);
        
        return () => clearInterval(interval);
    }, [startDate, endDate]);

    const fetchNotificationsOnly = async () => {
        const { data } = await supabase
            .from('Notificaciones')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setNotifications(data);
    };

    const handleMarkAsSeen = async () => {
        const unreadIds = notifications
            .filter(n => n.status === 'novista')
            .map(n => n.id);
            
        if (unreadIds.length > 0) {
            await supabase
                .from('Notificaciones')
                .update({ status: 'vista' })
                .in('id', unreadIds);
            
            // Local update
            setNotifications(prev => prev.map(n => ({ ...n, status: 'vista' })));
        }
    };

    const handleToggleNotif = () => {
        if (!isNotifOpen) {
            handleMarkAsSeen();
        }
        setIsNotifOpen(!isNotifOpen);
    };

    const handleAddDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingDriver(true);
        try {
            const correoLimpio = newDriver.correo.trim().toLowerCase();
            const nombreLimpio = newDriver.nombre.trim();
            const direccionLimpia = newDriver.direccion.trim();
            const telefonoLimpio = newDriver.telefono.trim();

            // 1. Verificar si ya existe en conductores
            const { data: existing } = await supabase
                .from('conductores')
                .select('id')
                .eq('correo', correoLimpio)
                .maybeSingle();

            if (existing) {
                throw new Error('Ya existe un conductor registrado con este correo electrónico.');
            }

            // 2. Crear cuenta Auth con signUp (funciona desde el cliente)
            //    email_confirm desactivado en Supabase → acceso inmediato
            const { error: authError } = await supabase.auth.signUp({
                email: correoLimpio,
                password: newDriver.contrasena,
                options: {
                    data: {
                        full_name: nombreLimpio,
                        isConductor: true,
                        isAdmin: false
                    }
                }
            });

            // Si el usuario ya existe en Auth, continuamos igualmente
            if (authError && !authError.message.toLowerCase().includes('already')) {
                console.warn('Auth signUp warning (non-blocking):', authError.message);
            }

            // 3. Insertar en conductores
            const { data: conductorData, error: conductorError } = await supabase
                .from('conductores')
                .insert([{
                    nombre: nombreLimpio,
                    direccion: direccionLimpia,
                    telefono: telefonoLimpio,
                    correo: correoLimpio,
                    contrasena: newDriver.contrasena,
                    marca: newDriver.marca,
                    modelo: newDriver.modelo,
                    ano: newDriver.ano,
                    color: newDriver.color,
                    placas: newDriver.placas,
                    puertas: newDriver.puertas
                }])
                .select()
                .single();

            if (conductorError) throw new Error(conductorError.message);

            // 4. Insertar en users con isConductor: true
            await supabase
                .from('users')
                .insert([{
                    nombre: nombreLimpio,
                    correo: correoLimpio,
                    telefono: telefonoLimpio,
                    isConductor: true,
                    isAdmin: false
                }]);
            // Ignoramos error si ya existe en users

            setDrivers(prev => [conductorData, ...prev]);
            setNewDriver({ 
                nombre: "", 
                direccion: "", 
                telefono: "", 
                correo: "", 
                contrasena: "",
                marca: "",
                modelo: "",
                ano: "",
                color: "",
                placas: "",
                puertas: "5",
                foto_file: null
            });
            alert("Conductor registrado con éxito. Ya puede iniciar sesión.");
        } catch (error: any) {
            console.error("Error al crear conductor:", error);
            alert("Error al registrar conductor: " + error.message);
        } finally {
            setIsSavingDriver(false);
        }
    };

    const handleOpenEdit = (driver: any) => {
        setEditingDriver(driver);
        setEditDriverForm({
            nombre: driver.nombre || "",
            direccion: driver.direccion || "",
            telefono: driver.telefono || "",
            correo: driver.correo || "",
            nuevaContrasena: "",
            marca: driver.marca || "",
            modelo: driver.modelo || "",
            ano: driver.ano || "",
            color: driver.color || "",
            placas: driver.placas || "",
            puertas: driver.puertas || "4"
        });
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDriver) return;
        setIsSavingEdit(true);
        try {
            const updates: any = {
                nombre: editDriverForm.nombre.trim(),
                direccion: editDriverForm.direccion.trim(),
                telefono: editDriverForm.telefono.trim(),
                correo: editDriverForm.correo.trim().toLowerCase()
            };
            if (editDriverForm.nuevaContrasena) {
                updates.contrasena = editDriverForm.nuevaContrasena;
            }

            // 1. Actualizar en conductores
            const { error: conductorError } = await supabase
                .from('conductores')
                .update(updates)
                .eq('id', editingDriver.id);

            if (conductorError) throw new Error(conductorError.message);

            // 2. Actualizar en users (sincronizado por correo original)
            await supabase
                .from('users')
                .update({
                    nombre: updates.nombre,
                    telefono: updates.telefono,
                    correo: editDriverForm.correo.trim().toLowerCase()
                })
                .eq('correo', editingDriver.correo);

            setDrivers(prev => prev.map(d => d.id === editingDriver.id ? { ...d, ...updates } : d));
            setEditingDriver(null);
            alert('Conductor actualizado con éxito.');
        } catch (err: any) {
            console.error('Error al editar conductor:', err);
            alert('Error al editar conductor: ' + err.message);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleApproveDriver = async (driver: any) => {
        if (!confirm(`¿Aprobar registro de ${driver.nombre}?`)) return;
        try {
            const { error } = await supabase
                .from('conductores')
                .update({ registro_status: 'approved' })
                .eq('id', driver.id);
            
            if (error) throw error;
            
            // Send notification email via Edge Function
            try {
                const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
                    body: {
                        email: driver.correo,
                        name: driver.nombre
                    }
                });
                
                if (emailError) {
                    console.error('Error al enviar correo de aprobación:', emailError);
                    // No bloqueamos el proceso si solo falla el email, pero avisamos
                    alert("Conductor aprobado, pero hubo un error al enviar el correo de notificación.");
                }
            } catch (mailErr) {
                console.error('Excepción al enviar email:', mailErr);
            }

            setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, registro_status: 'approved' } : d));
            alert("Conductor aprobado con éxito. Se ha enviado un correo de notificación.");
        } catch (err: any) {
            alert("Error al aprobar: " + err.message);
        }
    };

    const handleDeleteDriver = async (driver: any) => {
        if (!driver || !driver.id) {
            alert("Error: No se pudo identificar al conductor.");
            return;
        }

        if (!confirm(`¿Estás seguro de eliminar a ${driver.nombre}?`)) return;
        
        setIsDeletingDriver(driver.id);
        console.log('Intentando borrar conductor vía Edge Function:', driver.id);

        try {
            // Usamos Edge Function porque el sitio es estático (next export) y no soporta API routes en producción
            const { data, error } = await supabase.functions.invoke('manage-driver', {
                body: { 
                    action: 'delete',
                    conductorId: driver.id 
                }
            });

            if (error) {
                // Manejo de errores de la función
                console.error('Error de Edge Function:', error);
                
                // Si es un error de base de datos (llave foránea)
                if (error.message?.includes('23503')) {
                    alert("No se puede eliminar: El conductor tiene viajes registrados. Debes desasignarlo de sus viajes primero.");
                } else {
                    throw new Error(error.message || 'Error al procesar la eliminación');
                }
                return;
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            // Paso 2: Limpieza local
            setDrivers(prev => prev.filter(d => d.id !== driver.id));
            alert('Conductor, usuario y accesos eliminados correctamente.');

        } catch (err: any) {
            console.error('Error detallado al eliminar:', err);
            alert('Error al eliminar: ' + (err.message || 'Error técnico desconocido'));
        } finally {
            setIsDeletingDriver(null);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleOpenEditContact = (contact: any) => {
        setEditingContact(contact);
        setEditContactForm({
            booker_name: contact.booker_name || "",
            booker_phone: contact.booker_phone || "",
            email: contact.email || "",
            zone_rate: contact.zone_rate || "",
            vehicle_model: contact.vehicle_model || ""
        });
    };

    const handleSaveEditContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingContact) return;
        setIsSavingContactEdit(true);
        try {
            const updates = {
                booker_name: editContactForm.booker_name.trim(),
                booker_phone: editContactForm.booker_phone.trim(),
                email: editContactForm.email.trim().toLowerCase(),
                zone_rate: editContactForm.zone_rate,
                vehicle_model: editContactForm.vehicle_model.trim()
            };

            const { error } = await supabase
                .from('cotizaciones')
                .update(updates)
                .eq('id', editingContact.id);

            if (error) throw error;

            setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...updates } : c));
            setEditingContact(null);
            alert('Cotización actualizada con éxito.');
        } catch (err: any) {
            console.error('Error al editar cotización:', err);
            alert('Error al editar cotización: ' + err.message);
        } finally {
            setIsSavingContactEdit(false);
        }
    };

    const handleDeleteContact = async (e: React.MouseEvent, contact: any) => {
        e.stopPropagation();
        if (!confirm(`¿Eliminar permanentemente la cotización de ${contact.booker_name}?`)) return;
        setIsDeletingContact(contact.id);
        try {
            const { error } = await supabase
                .from('cotizaciones')
                .delete()
                .eq('id', contact.id);

            if (error) throw error;
            setContacts(prev => prev.filter(c => c.id !== contact.id));
        } catch (err: any) {
            console.error('Error al eliminar cotización:', err);
            alert('Error al eliminar cotización: ' + err.message);
        } finally {
            setIsDeletingContact(null);
        }
    };

    const handleAcceptContact = async (e: React.MouseEvent, contact: any) => {
        e.stopPropagation();
        
        const conductorId = selectedDrivers[contact.id];
        if (!conductorId) {
            alert("Por favor selecciona un conductor para este viaje.");
            return;
        }

        try {
            const { error: updateError } = await supabase
                .from('cotizaciones')
                .update({ status: 'accepted' })
                .eq('id', contact.id);

            if (updateError) throw updateError;
            
            // Insert into confirmed trips
            const { error: insertError } = await supabase
                .from('viajes_confirmados')
                .insert([{
                    cotizacion_id: contact.id,
                    conductor_id: conductorId,
                    status: 'asignado',
                    vehicle_model: contact.vehicle_model,
                    vehicle_image: contact.vehicle_image,
                    schedule: contact.schedule,
                    booker_name: contact.booker_name,
                    passenger_phone: contact.passenger_phone,
                    booker_phone: contact.booker_phone,
                    zone_rate: contact.zone_rate,
                    monto_cobrar: parseFloat(contact.zone_rate || "0"),
                    payment_method: contact.payment_method,
                    pickup_address: contact.pickup_address,
                    pickup_zip: contact.pickup_zip,
                    pickup_ext_num: contact.pickup_ext_num,
                    pickup_municipality: contact.pickup_municipality,
                    dropoff_address: contact.dropoff_address,
                    dropoff_zip: contact.dropoff_zip,
                    dropoff_municipality: contact.dropoff_municipality,
                    adults: contact.adults || 1,
                    kids: contact.kids || 0,
                    pasajeros_adultos: contact.adults || 1,
                    pasajeros_ninos: contact.kids || 0,
                    luggage_10kg: contact.luggage_10kg,
                    luggage_25kg: contact.luggage_25kg,
                    carry_on: contact.carry_on,
                    extra_destination: contact.extra_destination,
                    extra_destination_address: contact.extra_destination_address,
                    passenger_pays: contact.passenger_pays,
                    bilingual: contact.bilingual,
                    email: contact.email,
                    extra_specs: contact.extra_specs,
                    anotaciones: contact.extra_specs,
                    distance_km: contact.distance_km,
                    distancia: contact.distance_km,
                    tiempoconductor: 60 // Default set before as asked
                }]);
                
            if (insertError) throw insertError;

            setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'accepted' } : c));
            alert("¡Servicio confirmado y movido a la Pizarra de Operaciones!");
            setActiveSection("trips"); // Switch directly to trips view to see it on the calendar
            // We could also re-fetch trips here or manage them in state
        } catch (error) { console.error(error); alert("Error"); }
    };

    const getVehicleImage = (contact: any) => {
        const matchedVehicle = vehicles.find(v => {
            if (!v.Modelo || !contact.vehicle_model) return false;
            const vModel = v.Modelo.trim().toLowerCase();
            const cModel = contact.vehicle_model.trim().toLowerCase();
            return vModel === cModel || cModel.includes(vModel) || vModel.includes(cModel);
        });

        if (matchedVehicle && matchedVehicle.imagen) {
            const vImg = matchedVehicle.imagen;
            return vImg.includes("ejeturmex.com") || vImg.includes("taxiseguro.com") ? `/images/${vImg.split("/").pop()}` : vImg;
        }

        if (contact.vehicle_image) {
            const cImg = contact.vehicle_image;
            return cImg.includes("ejeturmex.com") || cImg.includes("taxiseguro.com") ? `/images/${cImg.split("/").pop()}` : cImg;
        }

        const model = contact.vehicle_model || "";
        if (model.includes("Aveo")) return "/images/flotilla/aveo.png";
        if (model.includes("Sonata")) return "/images/flotilla/sonata.png";
        if (model.includes("Pickup")) return "/images/flotilla/pickup.png";
        if (model.includes("Suburban")) return "/images/flotilla/suburban.png";
        if (model.includes("Van")) return "/images/flotilla/van.png";
        if (model.includes("Sprinter")) return "/images/flotilla/sprinter.png";
        return "/images/flotilla/suburban.png";
    };

    const safeDateFormat = (dateStr: string | null, formatStr: string) => {
        if (!dateStr) return "Sin fecha";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return "Fecha inválida";
            return format(date, formatStr, { locale: es });
        } catch (e) {
            return "Error de fecha";
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-black" />
                    <p className="text-gray-400 font-medium animate-pulse">Iniciando plataforma...</p>
                </div>
            </div>
        );
    }

    const filteredAndSortedContacts = contacts
        .filter(contact => {
            let matchesTab = true;
            if (activeTab === 'pending') matchesTab = contact.status === 'pending' || !contact.status;
            else if (activeTab === 'accepted') matchesTab = contact.status === 'accepted';

            let matchesDate = true;
            if (startDate && endDate) {
                try {
                    // Use creation date or reservation date for filtering depending on sort
                    const comparisonDate = (sortBy === 'schedule' || sortBy === 'category') 
                        ? (contact.fechadesolicitud || contact.created_at)
                        : contact.created_at;
                        
                    const targetDate = new Date(comparisonDate);
                    if (!isNaN(targetDate.getTime())) {
                        const contactDateStr = targetDate.toISOString().split('T')[0];
                        matchesDate = contactDateStr >= startDate && contactDateStr <= endDate;
                    }
                } catch (e) { matchesDate = false; }
            }
            return matchesTab && matchesDate;
        })
        .sort((a, b) => {
            // Priority 1: Pending status first (if not in 'accepted' tab)
            if (activeTab === 'all') {
                const statusPriority = (s: string) => (s === 'pending' || !s) ? 0 : 1;
                const pA = statusPriority(a.status);
                const pB = statusPriority(b.status);
                if (pA !== pB) return pA - pB;
            }

            // Priority 2: User selected sort
            if (sortBy === 'created_at') {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            if (sortBy === 'schedule') {
                return new Date(a.fechadesolicitud || 0).getTime() - new Date(b.fechadesolicitud || 0).getTime();
            }
            if (sortBy === 'vehicle') {
                return (a.vehicle_model || "").localeCompare(b.vehicle_model || "");
            }
            if (sortBy === 'category') {
                const getCatName = (model: string) => {
                    const v = vehicles.find(v => v.Modelo === model);
                    return v?.categorias_vehiculos?.nombre || "";
                };
                return getCatName(a.vehicle_model).localeCompare(getCatName(b.vehicle_model));
            }
            return 0;
        });

    const filteredInvoices = invoices.filter(inv => {
        if (!startDate || !endDate) return true;
        try {
            const targetDate = new Date(inv.fecha_servicio || inv.created_at);
            if (!isNaN(targetDate.getTime())) {
                const dStr = targetDate.toISOString().split('T')[0];
                return dStr >= startDate && dStr <= endDate;
            }
        } catch (e) { return false; }
        return true;
    });

    const unreadNotifs = notifications.filter(n => n.status === 'novista');
    
    const maxVal = Math.max(eventStats.visita, eventStats.contacto, eventStats.formulario, 1);
    const getBarWidth = (val: number) => `${(val / maxVal) * 100}%`;

    return (
        <div className="w-full">
            <div className="w-full">
                {activeSection === "overview" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">{isConductor ? "Mi Perfil (Conductor)" : "Resumen del Periodo"}</h2>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full md:w-auto">
                                <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1">
                                    <span className="text-xs font-bold text-gray-400">DESDE</span>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none w-full sm:w-auto" />
                                </div>
                                <div className="w-full h-px sm:w-px sm:h-6 bg-gray-200 my-1 sm:my-0"></div>
                                <div className="flex items-center gap-2 px-3 py-1">
                                    <span className="text-xs font-bold text-gray-400">HASTA</span>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none w-full sm:w-auto" />
                                </div>
                            </div>
                        </div>

                        {isConductor && driverProfile ? (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-bold mb-4">Mis Datos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-500 mb-1">Nombre</p>
                                        <p className="font-bold">{driverProfile.nombre}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-500 mb-1">Correo</p>
                                        <p className="font-bold">{driverProfile.correo}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                                        <p className="font-bold">{driverProfile.telefono}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-500 mb-1">Dirección</p>
                                        <p className="font-bold">{driverProfile.direccion}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                        <>
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: "Visitas Totales", value: eventStats.visita, icon: Globe, color: "blue" },
                                { label: "Clics WhatsApp", value: eventStats.contacto, icon: MousePointerClick, color: "green" },
                                { label: "Formularios", value: eventStats.formulario, icon: FileText, color: "purple" },
                                { label: "V. Únicos (IP)", value: uniqueVisitors, icon: User, color: "orange" }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-xl bg-gray-50 text-gray-800 group-hover:scale-110 transition-all`}>
                                            <stat.icon size={20} />
                                        </div>
                                        <TrendingUp className="text-green-500 w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                                    <h3 className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</h3>
                                </div>
                            ))}
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <BarChart3 className="text-blue-500" />
                                        Comparativa de Actividad
                                    </h2>
                                    <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-bold">Histórico Total</span>
                                </div>

                                <div className="space-y-8">
                                    {[
                                        { label: "Visitas al Home", val: eventStats.visita, color: "from-blue-400 to-blue-600" },
                                        { label: "Contactos WhatsApp", val: eventStats.contacto, color: "from-green-400 to-green-600" },
                                        { label: "Formularios Enviados", val: eventStats.formulario, color: "from-purple-400 to-purple-600" }
                                    ].map((row, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-sm font-bold text-gray-700">
                                                <span>{row.label}</span>
                                                <span className="text-gray-900">{row.val}</span>
                                            </div>
                                            <div className="h-6 bg-gray-50 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full bg-gradient-to-r ${row.color} transition-all duration-1000 ease-out`}
                                                    style={{ width: getBarWidth(row.val) }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Status System Card */}
                            <div className="bg-black text-white p-8 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                                 <div className="relative z-10">
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                                        <CheckCheck className="text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-4">Sistema Taxiseguro</h2>
                                    <ul className="space-y-4 text-sm opacity-80">
                                        <li className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            Base de Datos: On-Air
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                                            Analíticas: Activas
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                                            Localización: MTY, MX
                                        </li>
                                    </ul>
                                 </div>
                                 <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4">
                                    <div className="flex-grow">
                                        <p className="text-xs opacity-50 font-bold uppercase tracking-widest">Conversión</p>
                                        <p className="text-2xl font-bold">
                                            {eventStats.visita > 0 ? ((eventStats.contacto + eventStats.formulario) / eventStats.visita * 100).toFixed(1) : 0}%
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-full">
                                        <ArrowUpRight size={20} />
                                    </div>
                                 </div>
                            </div>
                        </div>

                         {/* Manejos Actuales (Admin) */}
                         {!isConductor && (
                             <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-8">
                                 <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><MapPin className="text-blue-500" /> Manejos Actuales (Activos)</h3>
                                 <div className="grid gap-3">
                                     {adminActiveTrips?.length === 0 ? (
                                         <p className="text-gray-400 text-sm py-4 text-center">No hay servicios activos o pendientes en este momento.</p>
                                     ) : (
                                         adminActiveTrips?.map(trip => (
                                             <div key={trip.id} className="flex flex-col md:flex-row justify-between md:items-center p-4 bg-gray-50 rounded-xl border border-gray-100 gap-4">
                                                 <div>
                                                     <p className="font-bold flex items-center gap-2">
                                                         {trip.vehicle_model || "Transporte"} 
                                                         <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${trip.status === 'en curso' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                             {trip.status || 'pendiente'}
                                                         </span>
                                                     </p>
                                                     <p className="text-sm text-gray-500 mt-1">{trip.pickup_address} → {trip.dropoff_address}</p>
                                                 </div>
                                                 <div className="text-left md:text-right flex flex-col gap-2 md:gap-1">
                                                     <p className="text-sm font-bold text-gray-700">{trip.conductores?.nombre || "Sin conductor asignado"}</p>
                                                     <p className="text-xs text-gray-400">{safeDateFormat(trip.schedule || trip.created_at, "dd/MMM hh:mm a")}</p>
                                                 </div>
                                             </div>
                                         ))
                                     )}
                                 </div>
                             </div>
                         )}
                         
                         </>
                        )}

                        {/* Recent Activity Ticker */}
                        {!isConductor && (
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 overflow-hidden mt-8">
                                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase flex-shrink-0">Últimas Cotizaciones</div>
                                <div className="flex gap-8 whitespace-nowrap animate-marquee">
                                    {contacts.slice(0, 5).map(c => (
                                        <span key={c.id} className="text-xs text-gray-500 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                            Nueva cotización de <span className="font-bold text-gray-700">{c.booker_name}</span> para <span className="font-medium">{c.vehicle_model}</span> ({formatCurrency(c.zone_rate)})
                                        </span>
                                    ))}
                                    {contacts.length === 0 && (
                                        <span className="text-xs text-gray-400">No hay cotizaciones recientes.</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeSection === "contacts" && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                             <h2 className="text-2xl font-bold text-gray-900">Cotizaciones Solicitadas</h2>
                             <div className="flex flex-wrap gap-4">
                                 <div className="flex bg-gray-100 p-1 rounded-2xl">
                                     {['all', 'pending', 'accepted'].map((tab) => (
                                         <button
                                             key={tab}
                                             onClick={() => setActiveTab(tab)}
                                             className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === tab ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
                                         >
                                             {tab === 'all' ? 'Todas' : tab === 'pending' ? 'Pendientes' : 'Aceptadas'}
                                         </button>
                                     ))}
                                 </div>
                                 
                                 {/* Sort Dropdown */}
                                 <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl shadow-sm border border-gray-100">
                                     <Filter size={14} className="text-gray-400" />
                                     <span className="text-[10px] font-bold text-gray-400 uppercase">ORDENAR POR</span>
                                     <select 
                                         value={sortBy} 
                                         onChange={(e) => setSortBy(e.target.value)}
                                         className="text-xs font-bold bg-transparent focus:outline-none cursor-pointer"
                                     >
                                         <option value="created_at">Creación</option>
                                         <option value="schedule">Fecha Reserva</option>
                                         <option value="vehicle">Vehículo</option>
                                         <option value="category">Categoría</option>
                                     </select>
                                 </div>

                                 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full md:w-auto">
                                     <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1">
                                         <span className="text-xs font-bold text-gray-400">DESDE</span>
                                         <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none w-full sm:w-auto" />
                                     </div>
                                     <div className="w-full h-px sm:w-px sm:h-6 bg-gray-200 my-1 sm:my-0"></div>
                                     <div className="flex items-center gap-2 px-3 py-1">
                                         <span className="text-xs font-bold text-gray-400">HASTA</span>
                                         <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none w-full sm:w-auto" />
                                     </div>
                                 </div>
                             </div>
                         </div>

                         <div className="grid gap-4">
                             {filteredAndSortedContacts.length === 0 ? (
                                 <div className="bg-white p-20 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400 flex flex-col items-center gap-4">
                                     <FileText size={40} className="text-gray-200" />
                                     <p>No se encontraron cotizaciones para este filtro.</p>
                                 </div>
                             ) : (
                                 filteredAndSortedContacts.map((contact) => (
                                     <div key={contact.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 group">
                                         <div className="p-6 flex flex-col md:flex-row items-center gap-6 cursor-pointer" onClick={() => toggleExpand(contact.id)}>
                                             <div className="w-full md:w-40 h-24 relative flex-shrink-0 bg-gray-50 rounded-2xl flex items-center justify-center p-4 group-hover:scale-105 transition-transform">
                                                 <Image src={getVehicleImage(contact)} alt="car" width={140} height={80} className="object-contain" />
                                             </div>
                                             <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                                 <div className="space-y-1">
                                                     <h3 className="font-bold text-gray-900">{contact.vehicle_model}</h3>
                                                     <p className="text-xs text-gray-500 flex items-center gap-2"><User size={12} /> {contact.booker_name}</p>
                                                     <p className="text-xs text-gray-500 flex items-center gap-2"><Phone size={12} /> {contact.booker_phone}</p>
                                                 </div>
                                                 <div className="flex flex-col md:items-end justify-center space-y-2">
                                                     <span className="text-[10px] font-bold bg-gray-50 px-3 py-1 rounded-full text-gray-900 border border-gray-100">
                                                         {safeDateFormat(contact.fechadesolicitud, "dd MMM, h:mm a")}
                                                     </span>
                                                     <div className="flex items-center gap-2">
                                                         <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${contact.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                             {contact.status || 'pendiente'}
                                                         </span>
                                                         {(!contact.status || contact.status === 'pending') && (
                                                             <button onClick={(e) => handleAcceptContact(e, contact)} className="bg-black text-white px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-gray-800">ACEPTAR</button>
                                                         )}
                                                         <div className="flex gap-1 ml-2">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleOpenEditContact(contact); }}
                                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Editar"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                            </button>
                                                            <button 
                                                                onClick={(e) => handleDeleteContact(e, contact)}
                                                                disabled={isDeletingContact === contact.id}
                                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Eliminar"
                                                            >
                                                                {isDeletingContact === contact.id ? (
                                                                    <Loader2 size={14} className="animate-spin" />
                                                                ) : (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                                                )}
                                                            </button>
                                                         </div>
                                                         <ChevronRight className={`transition-transform ${expandedIds.includes(contact.id) ? "rotate-90" : ""} text-gray-300`} />
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                         {expandedIds.includes(contact.id) && (
                                              <div className="p-8 border-t border-gray-50 bg-gray-50/50 rounded-b-3xl grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
                                                   <div className="md:col-span-2 space-y-4">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <p className="font-bold text-xs uppercase text-gray-400 tracking-widest underline decoration-gray-200 underline-offset-4">Trayecto y Mapa</p>
                                                            {contact.distance_km && (
                                                                <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1.5 animate-in fade-in zoom-in">
                                                                    <Navigation size={10} /> {parseFloat(contact.distance_km || '0').toFixed(2)} KM
                                                                </span>
                                                            )}
                                                        </div>
                                                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[300px]">
                                                            <div className="space-y-4 flex flex-col justify-center">
                                                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">RECOGIDA</p>
                                                                    <p className="text-gray-900 font-medium leading-tight">{contact.pickup_address} {contact.pickup_ext_num}</p>
                                                                </div>
                                                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative">
                                                                    <div className="absolute -top-3 left-6 w-0.5 h-6 bg-gray-100" />
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">DESTINO</p>
                                                                    <p className="text-gray-900 font-medium leading-tight">{contact.dropoff_address}</p>
                                                                </div>
                                                                {contact.extra_destination && (
                                                                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                                                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter mb-1">PUNTO EXTRA</p>
                                                                        <p className="text-blue-900 font-medium leading-tight">{contact.extra_destination_address}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <QuotationMap pickup={contact.pickup_address} dropoff={contact.dropoff_address} />
                                                       </div>
                                                   </div>

                                                   <div className="space-y-6">
                                                       <div>
                                                            <p className="font-bold text-xs uppercase text-gray-400 tracking-widest underline decoration-gray-200 underline-offset-4 mb-4">Detalles Pax y Equipaje</p>
                                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                                <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-sm">
                                                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">ADULTOS</p>
                                                                    <p className="font-black text-xl text-gray-900">{contact.adults}</p>
                                                                </div>
                                                                <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-sm">
                                                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">NIÑOS</p>
                                                                    <p className="font-black text-xl text-gray-900">{contact.kids}</p>
                                                                </div>
                                                            </div>
                                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><Package size={14} className="text-blue-500" /> Equipaje Declarado</p>
                                                                <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
                                                                    <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg"><span>10KG</span><span className="text-lg">{contact.luggage_10kg || 0}</span></div>
                                                                    <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg"><span>25KG</span><span className="text-lg">{contact.luggage_25kg || 0}</span></div>
                                                                    <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg"><span>Mano</span><span className="text-lg">{contact.carry_on || 0}</span></div>
                                                                </div>
                                                            </div>
                                                       </div>
                                                       
                                                       <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Comentarios Extra</p>
                                                            <p className="text-xs text-gray-600 italic">"{contact.extra_specs || 'Sin especificaciones adicionales'}"</p>
                                                       </div>
                                                   </div>

                                                   <div className="space-y-6">
                                                       <div className="space-y-4">
                                                            <p className="font-bold text-xs uppercase text-gray-400 tracking-widest underline decoration-gray-200 underline-offset-4">Contacto y Pagos</p>
                                                            <div className="space-y-2 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                                <div className="flex items-center gap-3 py-1">
                                                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Mail size={14}/></div>
                                                                    <div className="overflow-hidden"><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">EMAIL</p><p className="truncate font-medium">{contact.email || 'N/A'}</p></div>
                                                                </div>
                                                                <div className="flex items-center gap-3 py-1 border-t border-gray-50">
                                                                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500"><Phone size={14}/></div>
                                                                    <div><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">TEL PASAJERO</p><p className="font-medium">{contact.passenger_phone || contact.booker_phone}</p></div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2 bg-black text-white p-5 rounded-2xl shadow-xl">
                                                                <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                                                                    <span className="text-[10px] font-bold opacity-40 uppercase">Cotización</span>
                                                                    <span className="font-black text-xl text-blue-400">{formatCurrency(contact.zone_rate)}</span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div><p className="text-[8px] font-bold opacity-40">MÉTODO PAGO</p><p className="text-[10px] font-bold uppercase">{contact.payment_method}</p></div>
                                                                    <div><p className="text-[8px] font-bold opacity-40">BILINGÜE</p><p className="text-[10px] font-bold uppercase">{contact.bilingual === 'si' ? 'REQUERIDO' : 'NO'}</p></div>
                                                                </div>
                                                                <div className="mt-2 pt-2 border-t border-white/10 flex justify-between">
                                                                    <span className="text-[8px] font-bold opacity-40">PAGO EN DESTINO</span>
                                                                    <span className="text-[8px] font-black uppercase text-yellow-400">{contact.passenger_pays === 'si' ? 'SÍ' : 'NO'}</span>
                                                                </div>
                                                            </div>
                                                       </div>

                                                       {(!contact.status || contact.status === 'pending') && (
                                                           <div className="space-y-3">
                                                               <div className="space-y-1.5">
                                                                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Asignar Conductor</p>
                                                                   <select 
                                                                       className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none appearance-none"
                                                                       value={selectedDrivers[contact.id] || ""}
                                                                       onChange={(e) => setSelectedDrivers({ ...selectedDrivers, [contact.id]: e.target.value })}
                                                                   >
                                                                       <option value="">Selecciona un chofer...</option>
                                                                       {drivers.map(d => (
                                                                           <option key={d.id} value={d.id}>{d.nombre}</option>
                                                                       ))}
                                                                   </select>
                                                               </div>
                                                               <button 
                                                                   disabled={!selectedDrivers[contact.id]}
                                                                   onClick={(e) => handleAcceptContact(e, contact)}
                                                                   className={`w-full text-white rounded-xl py-4 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                                                                       selectedDrivers[contact.id] 
                                                                           ? "bg-green-500 hover:bg-green-600 shadow-green-100" 
                                                                           : "bg-gray-300 cursor-not-allowed shadow-none"
                                                                   }`}
                                                               >
                                                                   <CheckCheck size={16} /> CONFIRMAR Y ASIGNAR
                                                               </button>
                                                           </div>
                                                       )}
                                                   </div>
                                               </div>
                                         )}
                                     </div>
                                 ))
                             )}
                         </div>
                     </div>
                )}

                {activeSection === "invoices" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                             <div>
                                <h2 className="text-2xl font-bold text-gray-900">Solicitudes de Facturación</h2>
                                <p className="text-gray-400 text-sm">Listado de tickets ingresados por clientes</p>
                             </div>
                             <div className="flex items-center gap-4">
                                 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full md:w-auto">
                                     <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1">
                                         <span className="text-xs font-bold text-gray-400">DESDE</span>
                                         <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none w-full sm:w-auto" />
                                     </div>
                                     <div className="w-full h-px sm:w-px sm:h-6 bg-gray-200 my-1 sm:my-0"></div>
                                     <div className="flex items-center gap-2 px-3 py-1">
                                         <span className="text-xs font-bold text-gray-400">HASTA</span>
                                         <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none w-full sm:w-auto" />
                                     </div>
                                 </div>
                             </div>
                        </div>

                        <div className="space-y-3">
                            {filteredInvoices.length === 0 ? (
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-20 text-center text-gray-400">No hay facturas pendientes.</div>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <div key={inv.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-gray-200 transition-colors">
                                        <div className="flex-grow min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Razón Social / RFC</p>
                                                <p className="font-bold text-gray-900 text-sm truncate">{inv.razon_social}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">{inv.rfc}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email / Tel</p>
                                                <p className="text-sm text-gray-600 truncate">{inv.email}</p>
                                                <p className="text-[10px] text-gray-400">{inv.telefono}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Costo</p>
                                                <p className="font-bold text-gray-900 text-sm">{formatCurrency(inv.cantidad)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Fecha</p>
                                                <p className="text-sm text-gray-500">{inv.fecha_servicio ? format(new Date(inv.fecha_servicio), "dd/MM/yyyy", { locale: es }) : format(new Date(inv.created_at), "dd/MM/yyyy", { locale: es })}</p>
                                            </div>
                                        </div>
                                        <div className="shrink-0">
                                            <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase ${inv.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {inv.status || 'pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                     {activeSection === "drivers" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Personal (Conductores)</h2>
                                <p className="text-gray-400 text-sm">Gestiona la información y acceso de tus choferes</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Form */}
                            <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit">
                                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Plus size={18} className="text-blue-500"/> Registrar Conductor
                                </h3>
                                <form onSubmit={handleAddDriver} className="space-y-4" noValidate>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Nombre Completo</label>
                                        <input type="text" required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
                                            value={newDriver.nombre} onChange={e => setNewDriver({...newDriver, nombre: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Dirección</label>
                                        <input type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
                                            value={newDriver.direccion} onChange={e => setNewDriver({...newDriver, direccion: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Teléfono</label>
                                        <input type="tel" required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
                                            value={newDriver.telefono} onChange={e => {
                                                const val = e.target.value;
                                                if (val === "" || /^[0-9]+$/.test(val)) {
                                                    setNewDriver({...newDriver, telefono: val});
                                                }
                                            }} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Correo Electrónico (Usuario)</label>
                                        <input type="email" required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
                                            value={newDriver.correo} onChange={e => setNewDriver({...newDriver, correo: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Contraseña</label>
                                        <div className="relative">
                                           <input type={showPassword ? "text" : "password"} required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors pr-10"
                                               value={newDriver.contrasena} onChange={e => setNewDriver({...newDriver, contrasena: e.target.value})} />
                                           <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                               {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                           </button>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 space-y-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Car size={12} className="text-gray-400" />
                                            Detalles del Vehículo (Solo para el nuevo conductor)
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Marca</label>
                                                <input type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
                                                    value={newDriver.marca} onChange={e => setNewDriver({...newDriver, marca: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Modelo</label>
                                                <input type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
                                                    value={newDriver.modelo} onChange={e => setNewDriver({...newDriver, modelo: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Año</label>
                                                <input type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
                                                    value={newDriver.ano} onChange={e => setNewDriver({...newDriver, ano: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Color</label>
                                                <input type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
                                                    value={newDriver.color} onChange={e => setNewDriver({...newDriver, color: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Placas</label>
                                                <input type="text" required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
                                                    value={newDriver.placas} onChange={e => setNewDriver({...newDriver, placas: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Pasajeros</label>
                                                <input type="number" required className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
                                                    value={newDriver.puertas} onChange={e => setNewDriver({...newDriver, puertas: e.target.value})} placeholder="5" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fotografía del Vehículo (Opcional)</label>
                                            <input type="file" accept="image/*" className="w-full p-3 border border-gray-100 rounded-2xl text-xs bg-gray-50"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setNewDriver({...newDriver, foto_file: file});
                                                    }
                                                }} />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isSavingDriver} className="w-full bg-black text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors mt-2">
                                        {isSavingDriver && <Loader2 size={16} className="animate-spin" />}
                                        {isSavingDriver ? "Guardando..." : "Guardar Registro"}
                                    </button>
                                </form>
                            </div>

                            {/* List */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Tabs */}
                                <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
                                    <button 
                                       onClick={() => setDriverTab("active")}
                                       className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${driverTab === 'active' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        CONDUCTORES ACTIVOS
                                    </button>
                                    <button 
                                       onClick={() => setDriverTab("pending")}
                                       className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all relative ${driverTab === 'pending' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        PENDIENTES
                                        {drivers.filter(d => d.registro_status === 'pending').length > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] animate-bounce">
                                                {drivers.filter(d => d.registro_status === 'pending').length}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {drivers.filter(d => driverTab === 'active' ? d.registro_status === 'approved' || !d.registro_status : d.registro_status === 'pending').length === 0 ? (
                                    <div className="bg-white p-20 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
                                        No hay conductores {driverTab === 'active' ? 'activos' : 'pendientes'} aún.
                                    </div>
                                ) : (
                                    drivers
                                       .filter(d => driverTab === 'active' ? d.registro_status === 'approved' || !d.registro_status : d.registro_status === 'pending')
                                       .map(driver => (
                                        <div key={driver.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start gap-4 group hover:border-gray-200 transition-all">
                                            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{driver.nombre}</h4>
                                                    <p className="text-xs text-gray-500">{driver.correo}</p>
                                                </div>
                                                <div className="flex flex-col justify-start">
                                                    <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={12}/> {driver.telefono}</p>
                                                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 truncate"><MapPin size={10}/> {driver.direccion || 'Sin dirección'}</p>
                                                </div>
                                                <div className="flex flex-col justify-start items-start lg:items-end gap-2">
                                                    <div className="flex items-center gap-2">
                                                        {driver.registro_status === 'pending' ? (
                                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Pendiente de Aprobación</span>
                                                        ) : (
                                                            <span className="text-[10px] bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Activo</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400">Registrado {safeDateFormat(driver.created_at, "dd MMM yyyy")}</p>
                                                    
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedDriverDocs(driver); }}
                                                            className="flex items-center gap-1 text-[10px] font-black text-white bg-black hover:bg-gray-800 px-4 py-2 rounded-xl transition-all shadow-sm"
                                                        >
                                                            <FileText size={12}/> VER DOCUMENTOS
                                                        </button>

                                                        {driver.registro_status === 'pending' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleApproveDriver(driver); }}
                                                                className="flex items-center gap-1 text-[10px] font-black text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl transition-all shadow-sm"
                                                            >
                                                                <CheckCheck size={12}/> APROBAR
                                                            </button>
                                                        )}

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    handleDeleteDriver(driver); 
                                                                }}
                                                                className="flex items-center gap-2 p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all border border-red-100 group/del"
                                                                title="Eliminar conductor"
                                                            >
                                                                {isDeletingDriver === driver.id ? (
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                                                        <span className="text-[10px] font-black uppercase tracking-widest md:block">Eliminar</span>
                                                                    </>
                                                                )}
                                                            </button>

                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(driver); }}
                                                                className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all border border-blue-100 flex items-center gap-2"
                                                                title="Editar conductor"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                                <span className="text-[10px] font-black uppercase tracking-widest md:block">Editar</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                        {editingContact && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setEditingContact(null); }}>
                                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200">
                                    <h3 className="text-xl font-bold mb-6">Editar Cotización</h3>
                                    <form onSubmit={handleSaveEditContact} className="space-y-4">
                                        <input type="text" value={editContactForm.booker_name} onChange={e => setEditContactForm({...editContactForm, booker_name: e.target.value})} className="w-full p-3 border rounded-xl" />
                                        <div className="flex gap-3">
                                            <button type="button" onClick={() => setEditingContact(null)} className="flex-1 py-3 border rounded-xl">Cancelar</button>
                                            <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl">Guardar</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                {activeSection === "trips" && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                         {isConductor ? (
                             <>
                                 <h2 className="text-2xl font-bold text-gray-900">Mis Viajes Pendientes y Confirmados</h2>
                                 
                                 {/* Date Filter specifically for conductor trips view */}
                                 <div className="mt-4 flex flex-col items-start gap-4">
                                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full md:w-auto">
                                         <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1">
                                             <span className="text-xs font-bold text-gray-400">DESDE</span>
                                             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none w-full sm:w-auto" />
                                         </div>
                                         <div className="w-full h-px sm:w-px sm:h-6 bg-gray-200 my-1 sm:my-0"></div>
                                         <div className="flex items-center gap-2 px-3 py-1">
                                             <span className="text-xs font-bold text-gray-400">HASTA</span>
                                             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none w-full sm:w-auto" />
                                         </div>
                                     </div>
                                     <span className="text-sm text-gray-500 font-medium hidden md:inline-block">Filtrando lista de viajes...</span>
                                 </div>

                                 <div className="grid gap-6 mt-6">
                                     {viajesDriver.length === 0 ? (
                                         <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center text-gray-500">
                                             <MapPin size={32} className="mx-auto text-gray-300 mb-3" />
                                             No tienes viajes asignados en este momento.
                                         </div>
                                     ) : (
                                         viajesDriver.map(viaje => (
                                             <div key={viaje.id} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transition-all hover:shadow-2xl">
                                                 <div className="flex flex-col md:flex-row min-h-[300px]">
                                                     {/* Info Side */}
                                                     <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col justify-between">
                                                         <div>
                                                             <div className="flex items-center justify-between mb-4">
                                                                 <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{viaje.status || 'Pendiente'}</span>
                                                                 </div>
                                                                 <span className="text-xl font-black text-gray-900">{formatCurrency(viaje.monto_cobrar)}</span>
                                                             </div>

                                                             <h3 className="text-2xl font-black text-gray-900 mb-4">{viaje.vehicle_model || "Transporte Ejecutivo"}</h3>
                                                             
                                                             <div className="space-y-4 mb-6">
                                                                 <div className="flex items-start gap-3">
                                                                     <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white shrink-0">
                                                                         <MapPin size={14} />
                                                                     </div>
                                                                     <div>
                                                                         <p className="text-[9px] font-black text-gray-400 uppercase">Ruta del Servicio</p>
                                                                         <p className="text-sm font-bold text-gray-700">{viaje.pickup_address} → {viaje.dropoff_address}</p>
                                                                         {viaje.distancia && <p className="text-[10px] font-bold text-blue-500 mt-1">{viaje.distancia} Kilómetros</p>}
                                                                     </div>
                                                                 </div>

                                                                 <div className="grid grid-cols-2 gap-4">
                                                                     <div className="flex items-center gap-3">
                                                                         <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                                                             <Users size={14} />
                                                                         </div>
                                                                         <div>
                                                                             <p className="text-[9px] font-black text-gray-400 uppercase">Pasajeros</p>
                                                                             <p className="text-xs font-bold text-gray-700">{viaje.pasajeros_adultos || 1} Adultos, {viaje.pasajeros_ninos || 0} Niños</p>
                                                                         </div>
                                                                     </div>
                                                                     <div className="flex items-center gap-3">
                                                                         <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                                                             <Package size={14} />
                                                                         </div>
                                                                         <div>
                                                                             <p className="text-[9px] font-black text-gray-400 uppercase">Carga / Enganche</p>
                                                                             <p className="text-xs font-bold text-gray-700">{viaje.carga_extra || 0} kg / {viaje.tiempoconductor || 60} mins</p>
                                                                         </div>
                                                                     </div>
                                                                 </div>

                                                                 <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                                                                     <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                                                         <User size={14} />
                                                                     </div>
                                                                     <div>
                                                                         <p className="text-[9px] font-black text-gray-400 uppercase">Cliente / Contacto</p>
                                                                         <p className="text-xs font-bold text-gray-700">{viaje.booker_name} ({viaje.booker_phone})</p>
                                                                         {viaje.email && <p className="text-[10px] text-gray-400">{viaje.email}</p>}
                                                                     </div>
                                                                 </div>

                                                                 {viaje.anotaciones && (
                                                                     <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                                                                         <p className="text-[9px] font-black text-yellow-600 uppercase mb-1">Notas del viaje</p>
                                                                         <p className="text-xs text-yellow-800 italic leading-relaxed">{viaje.anotaciones}</p>
                                                                     </div>
                                                                 )}
                                                             </div>
                                                         </div>

                                                         <div className="flex gap-3">
                                                             {viaje.status !== 'finalizado' ? (
                                                                 <>
                                                                    {viaje.status === 'en curso' ? (
                                                                        <button onClick={() => {
                                                                            supabase.from('viajes_confirmados').update({ status: 'pausado' }).eq('id', viaje.id).then(() => fetchData())
                                                                        }} className="flex-1 py-4 bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all">
                                                                            Pausar Servicio
                                                                        </button>
                                                                    ) : (
                                                                        <button onClick={() => {
                                                                            supabase.from('viajes_confirmados').update({ status: 'en curso' }).eq('id', viaje.id).then(() => fetchData())
                                                                        }} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${viaje.status === 'pausado' ? 'bg-orange-400 text-white' : 'bg-blue-500 text-white shadow-lg shadow-blue-200 hover:bg-blue-600'}`}>
                                                                            {viaje.status === 'pausado' ? 'Reanudar Servicio' : 'Comenzar Servicio'}
                                                                        </button>
                                                                    )}
                                                                    
                                                                    <button onClick={() => {
                                                                        if (confirm("¿Estás seguro de finalizar el servicio?")) {
                                                                            supabase.from('viajes_confirmados').update({ status: 'finalizado' }).eq('id', viaje.id).then(() => fetchData())
                                                                        }
                                                                    }} className="flex-1 py-4 bg-green-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-green-100 hover:bg-green-600 transition-all">
                                                                        Finalizar
                                                                    </button>
                                                                 </>
                                                             ) : (
                                                                 <button disabled className="w-full py-4 bg-gray-50 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-gray-100 cursor-not-allowed">
                                                                     Servicio Finalizado (Solo Lectura)
                                                                 </button>
                                                             )}
                                                         </div>
                                                     </div>

                                                     {/* Map Side */}
                                                     <div className="hidden md:block w-full md:w-2/5 relative bg-gray-50 min-h-[300px]">
                                                         <QuotationMap pickup={viaje.pickup_address} dropoff={viaje.dropoff_address} />
                                                     </div>
                                                 </div>
                                             </div>
                                         ))
                                     )}
                                 </div>
                             </>
                         ) : (
                             <>
                                 <h2 className="text-2xl font-bold text-gray-900 mb-6">Pizarra de Operaciones</h2>
                                 <TripsBoard onFacturar={(trip) => {
                                     setActiveSection("invoices");
                                     // Optional: Add logic here to pre-fill an invoice form if it existed
                                 }} />
                             </>
                         )}
                     </div>
                )}
                </div>

            {/* Global Modals for Drivers */}
            {selectedDriverDocs && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setSelectedDriverDocs(null); }}>
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden my-8">
                        <div className="bg-black p-8 text-white flex justify-between items-start">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black">
                                    {selectedDriverDocs.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">{selectedDriverDocs.nombre}</h3>
                                    <p className="text-white/60 font-medium">{selectedDriverDocs.correo}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDriverDocs(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contacto</h4>
                                    <div className="bg-gray-50 p-5 rounded-3xl">
                                        <p className="text-sm font-bold text-gray-700">{selectedDriverDocs.telefono}</p>
                                        <p className="text-sm font-bold text-gray-700">{selectedDriverDocs.direccion}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Vehículo</h4>
                                    <div className="bg-gray-50 p-5 rounded-3xl">
                                        <p className="text-sm font-bold text-gray-700">{selectedDriverDocs.marca} {selectedDriverDocs.modelo}</p>
                                        <p className="text-sm font-bold text-gray-700 uppercase">{selectedDriverDocs.placas}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { label: "Licencia", url: selectedDriverDocs.licencia_url },
                                    { label: "INE", url: selectedDriverDocs.ine_url },
                                    { label: "Domicilio", url: selectedDriverDocs.comprobante_url },
                                    { label: "Seguro", url: selectedDriverDocs.seguro_url },
                                    { label: "Tarjeta", url: selectedDriverDocs.tarjeta_url },
                                    { label: "CURP", url: selectedDriverDocs.curp_url },
                                    { label: "Acta", url: selectedDriverDocs.acta_url },
                                    { label: "Alta", url: selectedDriverDocs.alta_firmada_url },
                                ].map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-3xl border border-gray-100">
                                        <p className="text-xs font-black">{doc.label}</p>
                                        {doc.url && <a href={doc.url} target="_blank" className="p-2 bg-gray-100 rounded-xl"><ExternalLink size={14}/></a>}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                {selectedDriverDocs.registro_status === 'pending' && (
                                    <button onClick={() => { handleApproveDriver(selectedDriverDocs); setSelectedDriverDocs(null); }} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Aprobar</button>
                                )}
                                <button onClick={() => setSelectedDriverDocs(null)} className="py-4 px-8 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editingDriver && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setEditingDriver(null); }}>
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-2xl font-black">Editar Conductor</h3>
                            <button onClick={() => setEditingDriver(null)}><X size={24} /></button>
                        </div>
                        <div className="max-h-[80vh] overflow-y-auto p-8">
                            <form onSubmit={handleSaveEdit} className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Datos Personales</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Nombre Completo</label>
                                            <input type="text" value={editDriverForm.nombre} onChange={e => setEditDriverForm({...editDriverForm, nombre: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-black/5 transition-all" placeholder="Nombre" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Teléfono</label>
                                            <input type="tel" value={editDriverForm.telefono} onChange={e => setEditDriverForm({...editDriverForm, telefono: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-black/5 transition-all" placeholder="Teléfono" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Dirección</label>
                                            <input type="text" value={editDriverForm.direccion} onChange={e => setEditDriverForm({...editDriverForm, direccion: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-black/5 transition-all" placeholder="Dirección" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Información del Vehículo</h4>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setEditingDriver(null);
                                                setActiveSection("vehicles");
                                            }}
                                            className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                                        >
                                            Gestionar en sección Vehículos <ArrowRight size={12} />
                                        </button>
                                    </div>
                                    
                                    <div className="bg-gray-50 rounded-[30px] p-6 flex flex-col md:flex-row items-center gap-6 border border-gray-100">
                                        {/* Buscaremos el vehículo vinculado en la tabla Vehículos si existe, 
                                            por ahora mostramos los datos que tenemos en el objeto del conductor */}
                                        <div className="w-full md:w-32 h-24 bg-gray-200 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                                            <Car size={32} className="text-gray-400" />
                                        </div>
                                        <div className="flex-grow grid grid-cols-2 gap-4 w-full">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-gray-400">Modelo</p>
                                                <p className="text-sm font-bold">{editingDriver.modelo} {editingDriver.ano}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-gray-400">Placas</p>
                                                <p className="text-sm font-bold font-mono bg-white px-2 py-0.5 rounded border border-gray-100 inline-block">{editingDriver.placas}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-gray-400">Marca</p>
                                                <p className="text-sm font-medium">{editingDriver.marca}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-gray-400">Pasajeros</p>
                                                <p className="text-sm font-medium">{editingDriver.puertas}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 italic text-center px-4">
                                        La edición técnica del vehículo se realiza exclusivamente en la pestaña de Vehículos para mantener la integridad de los datos.
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setEditingDriver(null)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-600 hover:bg-gray-200 transition-all">Cancelar</button>
                                    <button type="submit" disabled={isSavingEdit} className="flex-[2] py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2">
                                        {isSavingEdit ? <Loader2 size={16} className="animate-spin" /> : "Guardar Cambios"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 20s linear infinite;
                }
            `}</style>
        </div>
    );
}
