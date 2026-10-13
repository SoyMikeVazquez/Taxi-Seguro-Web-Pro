"use client";

import PageHeader from "@/components/PageHeader";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";

const destinations = [
    "Intermunicipal", "Corredores Industriales", "Ciudades Vecinas", "Rutas Interestatales", "Aeropuertos Regionales", "Destinos Comerciales"
];

export default function TrasladoForaneo() {
    return (
        <main className="bg-white">
            <Header />
            <PageHeader
                title="Traslados Foráneos e Intermunicipales"
                subtitle="Viaja seguro por carretera con choferes profesionales y unidades verificadas"
                backgroundImage="/images/Untitled-design-3-1.png" // Fallback
            />

            <section className="py-20 md:py-28">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div data-aos="fade-right">
                            <span className="inline-block bg-neutral-100 text-black font-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
                                Cobertura Carretera
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-black mb-6 text-black font-ui tracking-tight">Tu mejor opción para viajar entre ciudades</h2>
                            <p className="text-neutral-600 mb-6 leading-relaxed font-body">
                                Ya sea por motivos laborales, médicos o personales, viaja de forma directa entre ciudades y municipios con la máxima comodidad. Olvídate de aglomeraciones en terminales de autobuses y viaja a tu propio ritmo en una unidad privada con choferes experimentados en autopista.
                            </p>

                            <h3 className="text-lg font-extrabold mb-4 text-black font-ui">Modalidades de Traslado</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                                {destinations.map((dest) => (
                                    <div key={dest} className="border border-neutral-300 text-black py-2.5 px-4 rounded-full text-center text-xs font-bold hover:border-black hover:bg-black hover:text-white transition-all cursor-default shadow-sm">
                                        {dest}
                                    </div>
                                ))}
                            </div>

                            <div className="bg-[#F7F7F8] p-7 rounded-[28px] mb-8 border border-neutral-200">
                                <p className="font-extrabold mb-4 text-black font-ui">Beneficios incluidos:</p>
                                <ul className="space-y-3 font-body text-sm">
                                    <li className="flex items-center gap-3 text-neutral-700">
                                        <span className="w-6 h-6 rounded-full bg-[#CCFF00] text-black flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span> Seguro de viajero con cobertura amplia.
                                    </li>
                                    <li className="flex items-center gap-3 text-neutral-700">
                                        <span className="w-6 h-6 rounded-full bg-[#CCFF00] text-black flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span> Unidades revisadas mecánicamente antes de cada viaje.
                                    </li>
                                    <li className="flex items-center gap-3 text-neutral-700">
                                        <span className="w-6 h-6 rounded-full bg-[#CCFF00] text-black flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span> Transparencia total en combustible y cotizaciones claras.
                                    </li>
                                </ul>
                            </div>

                            <Link href="/reservar" className="inline-flex items-center gap-2 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black py-4 px-8 rounded-full transition-all text-sm shadow-lg hover:scale-105">
                                <span>Cotizar viaje</span>
                                <span>→</span>
                            </Link>
                        </div>

                        <div className="relative h-[440px] w-full rounded-[36px] overflow-hidden shadow-2xl border-4 border-neutral-100" data-aos="fade-left">
                            <Image
                                src="/images/serv2.jpg"
                                alt="Traslado Foráneo Seguro en Taxi"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
