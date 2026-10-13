"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, User, MapPin, X, Plus, Navigation, Users, Mail, FileText, Package, DollarSign, Car, CheckCheck, Receipt } from "lucide-react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

function QuotationMap({ pickup, dropoff }: { pickup: string, dropoff: string }) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);

    // Initialize Map once
    useEffect(() => {
        if (!mapContainer.current) return;
        
        mapboxgl.accessToken = MAPBOX_TOKEN;
        const newMap = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-99.1332, 19.4326], // Default center
            zoom: 11,
            attributionControl: false,
            interactive: true
        });

        map.current = newMap;
        return () => {
             markers.current.forEach(m => m.remove());
             newMap.remove();
        };
    }, []);

    // Update markers and route when addresses change
    useEffect(() => {
        const updateMap = async () => {
            if (!map.current || !map.current.loaded()) {
                // If map not loaded yet, wait for it
                if (map.current) {
                    map.current.once('load', updateMap);
                }
                return;
            }

            const currentMap = map.current;

            // Clear old markers
            markers.current.forEach(m => m.remove());
            markers.current = [];

            // Clear old route
            if (currentMap.getSource('route')) {
                if (currentMap.getLayer('route')) {
                    currentMap.removeLayer('route');
                }
                currentMap.removeSource('route');
            }

            if (!pickup && !dropoff) return;

            try {
                const getCoords = async (addr: string) => {
                    if (!addr) return null;
                    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?access_token=${MAPBOX_TOKEN}`);
                    const data = await res.json();
                    return data.features?.[0]?.center;
                };

                const pCoords = await getCoords(pickup);
                const dCoords = await getCoords(dropoff);

                if (pCoords) {
                    const m = new mapboxgl.Marker({ color: '#fff' }).setLngLat(pCoords).addTo(currentMap);
                    markers.current.push(m);
                }
                if (dCoords) {
                    const m = new mapboxgl.Marker({ color: '#60a5fa' }).setLngLat(dCoords).addTo(currentMap);
                    markers.current.push(m);
                }

                if (pCoords && dCoords) {
                    const query = await fetch(
                        `https://api.mapbox.com/directions/v5/mapbox/driving/${pCoords[0]},${pCoords[1]};${dCoords[0]},${dCoords[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
                    );
                    const json = await query.json();
                    if (json.routes && json.routes[0]) {
                        const route = json.routes[0].geometry.coordinates;

                        const geojson: any = { 
                            type: 'Feature', 
                            geometry: { type: 'LineString', coordinates: route }, 
                            properties: {} 
                        };

                        if (currentMap.getSource('route')) {
                            (currentMap.getSource('route') as mapboxgl.GeoJSONSource).setData(geojson);
                        } else {
                            currentMap.addSource('route', {
                                type: 'geojson',
                                data: geojson
                            });

                            currentMap.addLayer({
                                id: 'route',
                                type: 'line',
                                source: 'route',
                                layout: { 'line-join': 'round', 'line-cap': 'round' },
                                paint: { 'line-color': '#60a5fa', 'line-width': 4, 'line-opacity': 0.8 }
                            });
                        }

                        const bounds = new mapboxgl.LngLatBounds();
                        bounds.extend(pCoords);
                        bounds.extend(dCoords);
                        currentMap.fitBounds(bounds, { padding: 50 });
                    }
                } else if (pCoords || dCoords) {
                    currentMap.flyTo({ center: (pCoords || dCoords) as [number, number], zoom: 14 });
                }
            } catch (e) {
                console.error("Map update error", e);
            }
        };

        updateMap();
    }, [pickup, dropoff]);

    return <div ref={mapContainer} className="absolute inset-0 z-0 h-full w-full" />;
}

export default function TripsBoard({ onFacturar }: { onFacturar?: (trip: any) => void }) {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [distance, setDistance] = useState<number>(0);
    const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
    const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [editingTripId, setEditingTripId] = useState<string | null>(null);

    // Search suggestions
    const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
    const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);

    const fetchSuggestions = async (query: string, setSugs: (val: any[]) => void) => {
        if (!query || query.length < 3 || !MAPBOX_TOKEN) {
            setSugs([]);
            return;
        }
        try {
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=mx`);
            const data = await res.json();
            setSugs(data.features || []);
        } catch (e) { console.error(e); }
    };

    const initialTripState = {
        schedule: "",
        vehicle_model: "",
        pickup_address: "",
        dropoff_address: "",
        booker_name: "",
        booker_phone: "",
        passenger_phone: "",
        email: "",
        adults: 1,
        kids: 0,
        carga_extra: 0,
        payment_method: "Efectivo",
        anotaciones: "",
        monto_cobrar: 0,
        tiempoconductor: 60,
    };

    const [newTrip, setNewTrip] = useState(initialTripState);

    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all vehicles to know which drivers have one assigned
            const { data: vehiclesData } = await supabase.from("Vehículos").select("*, categorias_vehiculos(*)");
            if (vehiclesData) setVehicles(vehiclesData);

            // Get unique conductor IDs that have an assigned vehicle
            const conductorIdsWithVehicle = new Set(
                vehiclesData?.filter(v => v.conductor_id).map(v => v.conductor_id) || []
            );

            // 2. Fetch only approved drivers
            const { data: driversData } = await supabase
                .from("conductores")
                .select("*")
                .eq("registro_status", "approved")
                .order("nombre");

            // 3. Filter drivers who actually have a vehicle assigned
            if (driversData) {
                const qualifiedDrivers = driversData.filter(d => conductorIdsWithVehicle.has(d.id));
                setDrivers(qualifiedDrivers);
            }

            // 4. Fetch trips
            const { data: tripsData } = await supabase
                .from("viajes_confirmados")
                .select("*, conductores(nombre)")
                .order("schedule", { ascending: true });
            if (tripsData) setTrips(tripsData);
        } catch (error) {
            console.error("Error fetching board data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDragStart = (e: React.DragEvent, driver: any) => {
        e.dataTransfer.setData("driverId", driver.id);
        e.dataTransfer.setData("driverName", driver.nombre);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.add("bg-blue-50");
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove("bg-blue-50");
    };

    const handleDrop = (e: React.DragEvent, date: Date) => {
        e.preventDefault();
        e.currentTarget.classList.remove("bg-blue-50");

        const driverId = e.dataTransfer.getData("driverId");
        const driverName = e.dataTransfer.getData("driverName");

        if (driverId) {
            setSelectedDriver({ id: driverId, nombre: driverName });
            setEditingTripId(null);
            
            const defaultTime = new Date(date);
            defaultTime.setHours(9, 0, 0, 0);
            const localISOTime = new Date(defaultTime.getTime() - defaultTime.getTimezoneOffset() * 60000).toISOString().slice(0,16);

            const defaultVehicle = vehicles.length > 0 ? vehicles[0].Modelo : "";

            setSelectedDate(date);
            setNewTrip({ 
                ...initialTripState,
                schedule: localISOTime,
                vehicle_model: defaultVehicle,
                adults: 1,
            });
            setDistance(0);
            setPickupCoords(null);
            setDropoffCoords(null);
            setIsModalOpen(true);
        }
    };

    const handleEditTrip = (trip: any) => {
        setEditingTripId(trip.id);
        setSelectedDriver({ id: trip.conductor_id, nombre: trip.conductores?.nombre });
        
        const tripDate = new Date(trip.schedule);
        const localISOTime = new Date(tripDate.getTime() - tripDate.getTimezoneOffset() * 60000).toISOString().slice(0,16);

        setNewTrip({
            schedule: localISOTime,
            vehicle_model: trip.vehicle_model || "",
            pickup_address: trip.pickup_address || "",
            dropoff_address: trip.dropoff_address || "",
            booker_name: trip.booker_name || "",
            booker_phone: trip.booker_phone || "",
            passenger_phone: trip.passenger_phone || "",
            email: trip.email || "",
            adults: trip.pasajeros_adultos || 1,
            kids: trip.pasajeros_ninos || 0,
            carga_extra: trip.carga_extra || 0,
            payment_method: trip.payment_method || "Efectivo",
            anotaciones: trip.anotaciones || "",
            monto_cobrar: trip.monto_cobrar || 0,
            tiempoconductor: trip.tiempoconductor || 60,
        });
        setDistance(trip.distancia || 0);
        setIsModalOpen(true);
        // Trigger initial calculation for edit mode
        if (trip.pickup_address && trip.dropoff_address) {
            updateDistanceAndPrice(trip.pickup_address, trip.dropoff_address, trip.vehicle_model || "");
        }
    };

    const handleDeleteTrip = async () => {
        if (!editingTripId) return;
        if (!confirm("¿Estás seguro de que deseas eliminar este servicio?")) return;

        try {
            const { error } = await supabase.from("viajes_confirmados").delete().eq("id", editingTripId);
            if (error) throw error;
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            alert("Error al eliminar: " + error.message);
        }
    };

    const updateDistanceAndPrice = async (pickup: string, dropoff: string, vehicleModel: string) => {
        if (!pickup || !dropoff || !MAPBOX_TOKEN) return;

        try {
            // Geocode addresses
            const getCoords = async (addr: string) => {
                const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?access_token=${MAPBOX_TOKEN}`);
                const data = await res.json();
                return data.features?.[0]?.geometry.coordinates as [number, number];
            };

            const pCoords = await getCoords(pickup);
            const dCoords = await getCoords(dropoff);

            if (pCoords && dCoords) {
                setPickupCoords(pCoords);
                setDropoffCoords(dCoords);

                const query = await fetch(
                    `https://api.mapbox.com/directions/v5/mapbox/driving/${pCoords[0]},${pCoords[1]};${dCoords[0]},${dCoords[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
                );
                const json = await query.json();
                if (json.routes && json.routes[0]) {
                    const dist = json.routes[0].distance / 1000;
                    setDistance(dist);

                    // Calculate price if vehicle is selected
                    const vehicle = vehicles.find(v => v.Modelo === vehicleModel);
                    if (vehicle && vehicle.categorias_vehiculos) {
                        const pricing = vehicle.categorias_vehiculos;
                        const price = Math.max(pricing.final_minima || 0, dist * (pricing.final_precio_km || 0));
                        setNewTrip(prev => ({ ...prev, monto_cobrar: Math.round(price) }));
                    }
                }
            }
        } catch (e) {
            console.error("Pricing/Route error", e);
        }
    };

    // Map updates only occur on selection or modal open, removed 1s debounce from here
    const handleSaveTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const tripData = {
                conductor_id: selectedDriver.id,
                ...newTrip,
                schedule: new Date(newTrip.schedule).toISOString(),
                distancia: distance,
                pasajeros_adultos: newTrip.adults,
                pasajeros_ninos: newTrip.kids,
            };

            if (editingTripId) {
                const { error } = await supabase
                    .from("viajes_confirmados")
                    .update(tripData)
                    .eq("id", editingTripId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("viajes_confirmados")
                    .insert([tripData]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchData();
            alert(editingTripId ? "Viaje actualizado exitosamente." : "Viaje asignado exitosamente.");
        } catch (error: any) {
            alert("Error al guardar el viaje: " + error.message);
        }
    };

    if (loading) {
        return <div className="p-10 text-center">Cargando pizarra...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-in fade-in">
            {/* Header / Toolbar */}
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-wrap gap-3 justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-100">← Ant.</button>
                    <h3 className="font-bold text-base capitalize">{format(startOfCurrentWeek, "MMMM yyyy", { locale: es })}</h3>
                    <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-100">Sig. →</button>
                </div>
                <p className="text-xs text-gray-400 font-medium hidden sm:block">Arrastra un conductor o usa el botón Agendar.</p>
            </div>

            <div className="flex flex-grow h-[600px] overflow-hidden">
                {/* Conductores Sidebar */}
                <div className="w-80 border-r border-gray-200 bg-gray-50/50 p-6 overflow-y-auto hidden md:block shrink-0">
                    <h4 className="font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
                        <User size={16} /> Conductores Disponibles
                    </h4>
                    <div className="space-y-4">
                        {drivers.map(driver => (
                            <div 
                                key={driver.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, driver)}
                                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing hover:border-black hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform shrink-0">
                                        {driver.nombre.substring(0,2).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-black text-gray-900 text-[15px] leading-tight truncate">{driver.nombre}</p>
                                        <p className="text-[11px] font-bold text-gray-400 mt-0.5 truncate">{driver.telefono}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Day List View */}
                <div className="flex-grow overflow-y-auto p-3 space-y-3 bg-gray-50/30">
                    {weekDays.map((day, idx) => {
                        const isToday = isSameDay(day, new Date());
                        const dayTrips = trips.filter(trip =>
                            trip.schedule && isSameDay(new Date(trip.schedule), day)
                        );
                        return (
                            <div
                                key={idx}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, day)}
                                className={`rounded-2xl border transition-colors ${isToday ? 'border-blue-200 bg-blue-50/20' : 'border-gray-100 bg-white'} shadow-sm overflow-hidden`}
                            >
                                {/* Day Header */}
                                <div className={`flex items-center justify-between px-4 py-3 border-b ${isToday ? 'border-blue-100 bg-blue-50/60' : 'border-gray-100 bg-gray-50/50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black leading-none shrink-0 ${isToday ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
                                            <span className="text-[8px] uppercase opacity-70">{format(day, "EEE", { locale: es })}</span>
                                            <span className="text-base">{format(day, "d")}</span>
                                        </div>
                                        <div>
                                            <p className={`font-black text-sm capitalize ${isToday ? 'text-blue-700' : 'text-gray-800'}`}>
                                                {format(day, "EEEE d 'de' MMMM", { locale: es })}
                                            </p>
                                            <p className="text-[11px] text-gray-400 font-medium">
                                                {dayTrips.length === 0 ? 'Sin servicios' : `${dayTrips.length} servicio${dayTrips.length > 1 ? 's' : ''} agendado${dayTrips.length > 1 ? 's' : ''}`}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedDriver(drivers[0] || null);
                                            setEditingTripId(null);
                                            const t = new Date(day);
                                            t.setHours(9, 0, 0, 0);
                                            const iso = new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                            setNewTrip({ ...initialTripState, schedule: iso, vehicle_model: vehicles[0]?.Modelo || "", adults: 1 });
                                            setSelectedDate(day);
                                            setDistance(0);
                                            setPickupCoords(null);
                                            setDropoffCoords(null);
                                            setIsModalOpen(true);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-black text-white text-[11px] font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shrink-0"
                                    >
                                        <Plus size={13} /> Agendar
                                    </button>
                                </div>

                                {/* Trips */}
                                {dayTrips.length > 0 ? (
                                    <div className="divide-y divide-gray-50">
                                        {dayTrips.map(trip => (
                                            <div
                                                key={trip.id}
                                                onClick={() => handleEditTrip(trip)}
                                                className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors group ${trip.status === 'en curso' ? 'border-l-4 border-l-blue-400' : trip.status === 'finalizado' ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-transparent hover:border-l-gray-200'}`}
                                            >
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="w-12 text-center">
                                                        <p className="text-base font-black text-gray-900 leading-none">{format(new Date(trip.schedule), "HH:mm")}</p>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase">hrs</p>
                                                    </div>
                                                    <div className={`w-2 h-2 rounded-full ${trip.status === 'en curso' ? 'bg-blue-500' : trip.status === 'finalizado' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                        <p className="font-bold text-gray-900 text-sm truncate">{trip.booker_name || "Sin nombre"}</p>
                                                        {trip.status === 'finalizado' && <span className="text-[9px] font-black uppercase text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"><CheckCheck size={8} /> Listo</span>}
                                                        {trip.status === 'en curso' && <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">En curso</span>}
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate"><MapPin size={9} className="shrink-0" />{trip.pickup_address}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-[11px] font-bold text-gray-700">{trip.conductores?.nombre || '—'}</p>
                                                        <p className="text-[10px] text-gray-400">{trip.vehicle_model?.split(' ')[0] || 'Unidad'}</p>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-black text-[10px] group-hover:bg-black group-hover:text-white transition-all">
                                                        {(trip.conductores?.nombre || '?').substring(0, 2).toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-5 text-center text-gray-300 text-[11px] font-bold uppercase tracking-widest">
                                        — Sin servicios —
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal for new trip */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full hover:bg-gray-200 z-10">
                            <X size={20} />
                        </button>
                        
                        {/* Form Section */}
                        <div className="w-full md:w-1/2 p-8 overflow-y-auto">
                            <div className="flex justify-between items-start mb-1">
                                <h2 className="text-2xl font-black">{editingTripId ? 'Editar Viaje' : 'Nuevo Viaje'}</h2>
                                {editingTripId && (
                                    <div className="flex items-center gap-2">
                                        {trips.find(t => t.id === editingTripId)?.status === 'finalizado' && (
                                            <button 
                                                type="button" 
                                                onClick={() => onFacturar && onFacturar(trips.find(t => t.id === editingTripId))}
                                                className="text-[10px] bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 text-green-600 font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-green-100 transition-all shadow-sm"
                                            >
                                                <Receipt size={14} /> Facturar Servicio
                                            </button>
                                        )}
                                        <button 
                                            type="button" 
                                            onClick={handleDeleteTrip}
                                            className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                                        >
                                            Eliminar Servicio
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-500 text-xs mb-6 uppercase tracking-widest font-bold">Asignado a: {selectedDriver?.nombre}</p>

                            <form onSubmit={handleSaveTrip} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Fecha y Hora</label>
                                        <input required type="datetime-local" value={newTrip.schedule} onChange={e => setNewTrip({...newTrip, schedule: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 ring-black/5" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Vehículo / Categoría</label>
                                        <select required value={newTrip.vehicle_model} onChange={e => {
                                            const val = e.target.value;
                                            setNewTrip({...newTrip, vehicle_model: val});
                                            updateDistanceAndPrice(newTrip.pickup_address, newTrip.dropoff_address, val);
                                        }} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 ring-black/5">
                                            <option value="">Selecciona vehículo...</option>
                                            {vehicles.map(v => (
                                                <option key={v.id} value={v.Modelo}>{v.Modelo} ({v.categorias_vehiculos?.nombre})</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Nombre Solicitante / Empresa</label>
                                        <input required type="text" value={newTrip.booker_name} onChange={e => setNewTrip({...newTrip, booker_name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm" placeholder="Ej. Juan Pérez" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Teléfono Contacto</label>
                                        <input required type="text" value={newTrip.booker_phone} onChange={e => setNewTrip({...newTrip, booker_phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm" placeholder="+52 ..." />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Correo Electrónico</label>
                                        <input type="email" value={newTrip.email} onChange={e => setNewTrip({...newTrip, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm" placeholder="cliente@ejemplo.com" />
                                    </div>

                                    <div className="col-span-2 p-5 bg-blue-50/50 rounded-3xl space-y-4 border border-blue-100/50">
                                        <div className="relative">
                                            <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1 ml-1">Dirección de Origen</label>
                                            <input required type="text" value={newTrip.pickup_address} 
                                                onChange={e => {
                                                    setNewTrip({...newTrip, pickup_address: e.target.value});
                                                    fetchSuggestions(e.target.value, setPickupSuggestions);
                                                }} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="Escribe para buscar origen..." />
                                            {pickupSuggestions.length > 0 && (
                                                <div className="absolute z-[100] left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto backdrop-blur-xl">
                                                    {pickupSuggestions.map(s => (
                                                        <div key={s.id} onClick={() => {
                                                            setNewTrip({...newTrip, pickup_address: s.place_name});
                                                            setPickupSuggestions([]);
                                                            // Trigger map only on selection
                                                            updateDistanceAndPrice(s.place_name, newTrip.dropoff_address, newTrip.vehicle_model);
                                                        }} className="px-4 py-2.5 text-[11px] hover:bg-blue-50 cursor-pointer border-b border-gray-50 transition-colors">{s.place_name}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1 ml-1">Dirección de Destino</label>
                                            <input required type="text" value={newTrip.dropoff_address} 
                                                onChange={e => {
                                                    setNewTrip({...newTrip, dropoff_address: e.target.value});
                                                    fetchSuggestions(e.target.value, setDropoffSuggestions);
                                                }} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="Escribe para buscar destino..." />
                                            {dropoffSuggestions.length > 0 && (
                                                <div className="absolute z-[100] left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto backdrop-blur-xl">
                                                    {dropoffSuggestions.map(s => (
                                                        <div key={s.id} onClick={() => {
                                                            setNewTrip({...newTrip, dropoff_address: s.place_name});
                                                            setDropoffSuggestions([]);
                                                            // Trigger map only on selection
                                                            updateDistanceAndPrice(newTrip.pickup_address, s.place_name, newTrip.vehicle_model);
                                                        }} className="px-4 py-2.5 text-[11px] hover:bg-blue-50 cursor-pointer border-b border-gray-50 transition-colors">{s.place_name}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Pasajeros (A+N)</label>
                                        <div className="flex gap-2">
                                            <input type="number" min="1" value={newTrip.adults} onChange={e => setNewTrip({...newTrip, adults: parseInt(e.target.value)})} className="w-1/2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm" placeholder="Adults" />
                                            <input type="number" min="0" value={newTrip.kids} onChange={e => setNewTrip({...newTrip, kids: parseInt(e.target.value)})} className="w-1/2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm" placeholder="Kids" />
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Método de Pago</label>
                                        <select value={newTrip.payment_method} onChange={e => setNewTrip({...newTrip, payment_method: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold">
                                            <option>Efectivo</option>
                                            <option>Transferencia</option>
                                            <option>Tarjeta (+IVA)</option>
                                            <option>Facturado</option>
                                        </select>
                                    </div>

                                    <div className="col-span-2 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Anotaciones</label>
                                            <textarea value={newTrip.anotaciones} onChange={e => setNewTrip({...newTrip, anotaciones: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm min-h-[60px]" placeholder="Instrucciones adicionales..." />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Tiempo de Enganche (Mins)</label>
                                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                                                <Calendar size={14} className="text-gray-400" />
                                                <input required type="number" min="1" value={newTrip.tiempoconductor} onChange={e => setNewTrip({...newTrip, tiempoconductor: parseInt(e.target.value)})} className="bg-transparent w-full text-sm font-bold focus:outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full mt-4 bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all shadow-xl active:scale-[0.98]">
                                    {editingTripId ? 'Guardar Cambios' : 'Guardar y Confirmar Servicio'}
                                </button>
                            </form>
                        </div>

                        {/* Map & Info Sidebar */}
                        <div className="w-full md:w-1/2 bg-gray-900 relative min-h-[400px]">
                             <QuotationMap pickup={newTrip.pickup_address} dropoff={newTrip.dropoff_address} />
                             
                             <div className="absolute top-8 left-8 right-8 z-10 flex flex-col gap-3">
                                 <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
                                     <div className="flex justify-between items-center mb-4">
                                         <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Resumen del Viaje</span>
                                         <div className="flex items-center gap-1.5 bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-500/20">
                                             <Navigation size={10} className="text-blue-400" />
                                             <span className="text-[10px] font-black text-blue-400">{distance.toFixed(2)} KM</span>
                                         </div>
                                     </div>
                                     <div className="flex justify-between items-end">
                                         <div>
                                             <p className="text-white/40 text-[9px] font-bold uppercase mb-1">Monto Sugerido</p>
                                             <p className="text-4xl font-black text-white">${newTrip.monto_cobrar.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                         </div>
                                         <div className="text-right">
                                             <p className="text-white/40 text-[9px] font-bold uppercase mb-1">Carga Extra</p>
                                             <input type="number" value={newTrip.carga_extra} onChange={e => setNewTrip({...newTrip, carga_extra: parseFloat(e.target.value)})} className="bg-transparent text-white font-bold text-lg text-right w-20 focus:outline-none border-b border-white/20" />
                                         </div>
                                     </div>
                                 </div>
                             </div>

                              {!newTrip.pickup_address || !newTrip.dropoff_address ? (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-[2px]">
                                      <div className="text-center space-y-4 opacity-70">
                                          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 animate-pulse">
                                              <MapPin size={32} className="text-blue-400" />
                                          </div>
                                          <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Esperando direcciones...</p>
                                      </div>
                                  </div>
                              ) : null}
                             
                             <div className="absolute bottom-8 left-8 right-8 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex items-center gap-4 z-10">
                                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white shrink-0 border border-white/10">
                                     <Car size={20} className="text-blue-400" />
                                 </div>
                                 <div className="overflow-hidden">
                                     <p className="text-[9px] font-bold uppercase text-white/40 tracking-wider">Unidad Seleccionada</p>
                                     <p className="text-xs font-bold text-white truncate">{newTrip.vehicle_model || 'Pendiente de selección'}</p>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
