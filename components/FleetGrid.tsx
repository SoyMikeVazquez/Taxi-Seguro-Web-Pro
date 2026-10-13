"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Users, ShieldCheck, ClipboardCheck, ChevronLeft, ChevronRight } from "lucide-react";

interface Vehicle {
    id: number;
    Modelo: string;
    imagen: string;
    capacidadDeCarga: string;
    marca?: string;
    año?: number;
}

export default function FleetGrid() {
    const [fleet, setFleet] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);

    // Embla Carousel setup
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [
        Autoplay({ delay: 4000, stopOnInteraction: false })
    ]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
    const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        setScrollSnaps(emblaApi.scrollSnapList());
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);

        return () => {
            emblaApi.off("select", onSelect);
            emblaApi.off("reInit", onSelect);
        };
    }, [emblaApi, onSelect]);

    useEffect(() => {
        const fetchVehicles = async () => {
            const { data, error } = await supabase
                .from('Vehículos')
                .select('*')
                .eq('Disponibilidad', true)
                .eq('VerEnWeb', true)
                .order('id', { ascending: true });

            if (error) {
                console.error('Error fetching vehicles (accent):', error.message);
                // Fallback for non-accented name "Vehiculos"
                const { data: dataAlt, error: errorAlt } = await supabase
                    .from('Vehiculos')
                    .select('*')
                    .eq('Disponibilidad', true)
                    .eq('VerEnWeb', true)
                    .order('id', { ascending: true });
                
                if (errorAlt) {
                    console.error('Error fetching vehicles (plain):', errorAlt.message);
                } else {
                    setFleet(dataAlt || []);
                }
            } else {
                setFleet(data || []);
            }
            setLoading(false);
        };

        fetchVehicles();
    }, []);

    if (loading) {
        return (
            <section className="bg-white py-[80px]">
                <div className="container-legacy text-center">
                    <p className="text-xl text-gray-500">Cargando flota...</p>
                </div>
            </section>
        );
    }

    return (
        <section id="flotilla" className="bg-white py-[80px]">
            <div className="container-legacy relative">

                {/* Header with Navigation Controls */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-12 px-4">
                    <h2 className="text-[2rem] md:text-[2.5rem] font-bold text-black font-ui leading-tight text-left">
                        Comencemos, selecciona tu vehiculo
                    </h2>

                    {/* Arrow Navigation */}
                    <div className="flex gap-2 mt-4 md:mt-0">
                        <button
                            onClick={scrollPrev}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                            onClick={scrollNext}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>
                </div>

                {/* Carousel Viewport */}
                <div className="overflow-hidden px-2 py-4" ref={emblaRef}>
                    <div className="flex -ml-4 touch-pan-y">
                        {fleet.map((vehicle) => (
                            <div
                                key={vehicle.id}
                                className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_25%] pl-4"
                            >
                                <div className="bg-white rounded-[10px] overflow-hidden border border-gray-200 h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                                    {/* Image Container */}
                                    <div className="h-[200px] w-full flex items-center justify-center bg-white p-4">
                                        <Image
                                            src={vehicle.imagen && (vehicle.imagen.includes("ejeturmex.com") || vehicle.imagen.includes("taxiseguro.com")) ? `/images/${vehicle.imagen.split("/").pop()}` : vehicle.imagen}
                                            alt={vehicle.Modelo}
                                            width={300}
                                            height={200}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex flex-col flex-grow">
                                        <h3 className="text-[1.25rem] font-bold text-primary font-ui mb-4">
                                            {vehicle.marca ? `${vehicle.marca} ` : ""}{vehicle.Modelo} {vehicle.año ? `(${vehicle.año})` : ""}
                                        </h3>

                                        <ul className="space-y-3 mb-6 flex-grow">
                                            <li className="flex items-center gap-3 text-sm text-gray-700">
                                                <Users className="w-4 h-4 text-primary shrink-0" />
                                                <span>Capacidad de {vehicle.capacidadDeCarga} personas.</span>
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-gray-700">
                                                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                                                <span>Unidad sanitizada.</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm text-gray-700">
                                                <ClipboardCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                <span>Mantenimiento realizado y aprobado.</span>
                                            </li>
                                        </ul>

                                        <div className="mt-auto pt-6">
                                            <Link
                                                href={`/reservacion?id=${vehicle.id}&model=${encodeURIComponent(`${vehicle.marca || ""} ${vehicle.Modelo}`.trim())}`}
                                                className="block w-full text-center bg-black text-white font-bold py-3 px-4 rounded hover:bg-gray-800 transition-colors text-sm uppercase tracking-wide"
                                            >
                                                Seleccionar vehiculos
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-2 mt-8">
                    {scrollSnaps.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollTo(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === selectedIndex ? "bg-black w-2" : "bg-gray-300 hover:bg-gray-400"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
