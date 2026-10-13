"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import dynamic from 'next/dynamic';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, ArrowRight, Info, Calculator, Star, Search, RefreshCw, Car, Tag, CreditCard, Banknote } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Dynamically import SearchBox to avoid SSR issues with 'document'
const SearchBox = dynamic(
  () => import('@mapbox/search-js-react').then((mod) => mod.SearchBox),
  { ssr: false }
);

// Initialize Mapbox Token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface Location {
  name: string;
  coordinates: [number, number];
}

interface Vehicle {
  id: number;
  Modelo: string;
  categoria_id: number;
  categorias_vehiculos: {
    nombre: string;
    base_minima: number;
    base_precio_km: number;
    final_minima: number;
    final_precio_km: number;
  } | null;
}

const DEFAULT_ORIGIN: Location = {
  name: "Centro",
  coordinates: [-99.1332, 19.4326] // Centro México
};

export default function DistanceCalculator() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [origin, setOrigin] = useState<Location>(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState<Location | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOriginSearch, setShowOriginSearch] = useState(false);
  
  // Fleet and Selection state
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  // Fetch Fleet on mount
  useEffect(() => {
    const fetchFleet = async () => {
      const { data } = await supabase
        .from('Vehículos')
        .select(`
          id, 
          Modelo, 
          categoria_id,
          categorias_vehiculos (
            nombre,
            base_minima,
            base_precio_km,
            final_minima,
            final_precio_km
          )
        `)
        .order('Modelo');
      if (data) setFleet(data as any);
    };
    fetchFleet();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      if (!MAPBOX_TOKEN) {
        console.error("Mapbox Token is missing in environment variables.");
        return;
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-100.3161, 25.6866],
        zoom: 10,
        attributionControl: false
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('error', (e) => {
        console.error('Mapbox-gl error:', e.error);
      });
    } catch (err) {
      console.error('Error during map initialization:', err);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Effect to update route when origin or destination changes
  useEffect(() => {
    if (!origin || !destination || !map.current) return;

    const fetchRoute = async () => {
      setLoading(true);
      try {
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.coordinates[0]},${origin.coordinates[1]};${destination.coordinates[0]},${destination.coordinates[1]}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const json = await query.json();
        const data = json.routes[0];
        const route = data.geometry.coordinates;

        const geojson: any = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route
          }
        };

        if (map.current?.getSource('route')) {
          (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData(geojson);
        } else {
          map.current?.addLayer({
            id: 'route',
            type: 'line',
            source: {
              type: 'geojson',
              data: geojson
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#CC4E00',
              'line-width': 5,
              'line-opacity': 0.75
            }
          });
        }

        updateMarkers();

        setDistance(data.distance / 1000); // meters to km
        setDuration(data.duration / 60); // seconds to minutes

        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(origin.coordinates);
        bounds.extend(destination.coordinates);
        map.current?.fitBounds(bounds, { padding: { top: 100, bottom: 100, left: 100, right: 100 } });

      } catch (error) {
        console.error('Error fetching route:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [origin, destination]);

  const originMarker = useRef<mapboxgl.Marker | null>(null);
  const destMarker = useRef<mapboxgl.Marker | null>(null);

  const updateMarkers = () => {
    if (!map.current) return;

    if (origin) {
      if (originMarker.current) originMarker.current.remove();
      originMarker.current = new mapboxgl.Marker({ color: '#CC4E00' })
        .setLngLat(origin.coordinates)
        .addTo(map.current);
    }

    if (destination) {
      if (destMarker.current) destMarker.current.remove();
      destMarker.current = new mapboxgl.Marker({ color: '#B5892C' })
        .setLngLat(destination.coordinates)
        .addTo(map.current);
    }
  };

  // Pricing calculation
  const getPricing = () => {
    if (!distance || !selectedVehicleId) return null;
    const vehicle = fleet.find(v => v.id === selectedVehicleId);
    if (!vehicle || !vehicle.categorias_vehiculos) return null;

    const cat = vehicle.categorias_vehiculos;
    const basePrice = Math.max(cat.base_minima, distance * cat.base_precio_km);
    const finalPrice = Math.max(cat.final_minima, distance * cat.final_precio_km);

    return { 
      base: basePrice, 
      final: finalPrice, 
      catName: cat.nombre,
      model: vehicle.Modelo
    };
  };

  const currentQuote = getPricing();

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] w-full bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Sidebar Panel */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full lg:w-[400px] p-6 flex flex-col gap-6 bg-white z-10 border-r border-gray-100 overflow-y-auto"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Mapa de Cobertura</h1>
            <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase">Herramienta</span>
          </div>
          <p className="text-xs text-gray-400">Ubica destinos y calcula cotizaciones al instante.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center justify-between">
              <span>Buscador de Destino</span>
              <Navigation className="w-3 h-3" />
            </label>
            <div className="relative">
              <SearchBox
                accessToken={MAPBOX_TOKEN}
                placeholder="Busca un lugar de referencia..."
                onRetrieve={(res: any) => {
                  setDestination({
                    name: res.features[0].properties.full_address,
                    coordinates: res.features[0].geometry.coordinates
                  });
                }}
                theme={{
                  variables: {
                    fontFamily: 'var(--font-inter)',
                    unit: '14px',
                    borderRadius: '12px',
                    colorBackground: '#f9f9f9',
                    colorText: '#333333',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }
                }}
              />
            </div>
          </div>

          <div className="h-px bg-gray-50 my-2" />

          <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-gray-400">Origen Actual</span>
                <button 
                  onClick={() => setShowOriginSearch(!showOriginSearch)}
                  className="text-[10px] text-orange-600 hover:underline font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> CAMBIAR
                </button>
             </div>
             
             {showOriginSearch ? (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <SearchBox
                    accessToken={MAPBOX_TOKEN}
                    placeholder="Cambiar punto de origen..."
                    onRetrieve={(res: any) => {
                      setOrigin({
                        name: res.features[0].properties.full_address,
                        coordinates: res.features[0].geometry.coordinates
                      });
                      setShowOriginSearch(false);
                    }}
                    theme={{
                      variables: {
                        unit: '13px',
                        borderRadius: '8px',
                        colorBackground: '#fff'
                      }
                    }}
                  />
                </div>
             ) : (
                <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                   <div className="w-2 h-2 rounded-full bg-orange-600 shrink-0" />
                   <span className="line-clamp-1">{origin.name}</span>
                </div>
             )}
          </div>

          {/* Vehicle Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center justify-between">
              <span>Seleccionar Vehículo (Unidad)</span>
              <Car className="w-3.5 h-3.5 text-orange-600" />
            </label>
            <select 
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-100 transition-all appearance-none cursor-pointer"
              value={selectedVehicleId || ''}
              onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
            >
              <option value="">Selecciona una unidad...</option>
              {fleet.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.Modelo} — {unit.categorias_vehiculos?.nombre || 'General'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AnimatePresence>
          {distance !== null && !loading && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="space-y-4"
            >
              <div className="p-5 rounded-3xl bg-black shadow-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center text-white">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-white">Trayecto de</span>
                    <div className="text-3xl font-black">
                      {distance.toFixed(1)} <span className="text-sm font-normal text-white">km</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-white">T. Estimado</span>
                    <div className="text-xl font-bold text-white">
                      {Math.round(duration || 0)} <span className="text-xs font-normal">min</span>
                    </div>
                  </div>
                </div>

                {currentQuote && (
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/20">
                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Banknote className="w-3 h-3 text-green-400" />
                        <span className="text-[9px] font-bold uppercase text-white">Precio Base</span>
                      </div>
                      <div className="text-lg font-black text-white">
                        ${currentQuote.base.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-white">Efectivo</span>
                    </div>
                    <div className="bg-orange-600/30 p-3 rounded-2xl border border-orange-400/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CreditCard className="w-3 h-3 text-orange-300" />
                        <span className="text-[9px] font-bold uppercase text-white">Precio Final</span>
                      </div>
                      <div className="text-lg font-black text-white">
                        ${currentQuote.final.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-white">Tarjeta + IVA</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                   <Info className="w-3 h-3 text-white" />
                   <p className="text-[10px] text-white leading-tight">
                    {currentQuote 
                      ? `Cotización para ${currentQuote.model} (${currentQuote.catName})` 
                      : 'Cotización estimada sujeta a disponibilidad.'}
                   </p>
                </div>
              </div>

              {!selectedVehicleId && (
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center gap-3">
                  <Calculator className="w-5 h-5 text-orange-500 animate-pulse" />
                  <p className="text-[10px] text-orange-700 font-medium">Selecciona una unidad de la flota para calcular el precio del servicio.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-auto p-4 rounded-xl bg-gray-50 border border-gray-100 flex gap-3 text-[10px] text-gray-500 leading-relaxed shrink-0">
          <Info className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          <p>Esta herramienta utiliza el tabulador oficial de 2024 para servicios corporativos y traslados ejecutivos.</p>
        </div>
      </motion.div>

      {/* Map Content */}
      <div className="flex-1 relative bg-gray-50">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        {loading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center gap-3 z-50">
            <div className="w-6 h-6 border-3 border-orange-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[9px] font-black tracking-widest text-gray-900 animate-pulse">CALCULANDO...</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left {
          display: none !important;
        }
        .mapboxgl-ctrl-group {
          box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
          border: none !important;
          border-radius: 12px !important;
        }
      `}</style>
    </div>
  );
}
