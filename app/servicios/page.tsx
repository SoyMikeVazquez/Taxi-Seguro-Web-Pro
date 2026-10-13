"use client";

import PageHeader from "@/components/PageHeader";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const services = [
    {
        icon: "🚗",
        title: "Viajes Locales y Urbanos",
        desc: "Pide tu taxi al instante desde la app a cualquier destino dentro de las zonas de cobertura habilitadas. Solicítalo en minutos o agenda con anticipación.",
        link: "/reservar"
    },
    {
        icon: "🏙️",
        title: "Servicio Ejecutivo y Programado",
        desc: "Traslados confortables y puntuales para citas de negocios, trámites o compromisos personales en unidades selectas y bien mantenidas."
    },
    {
        icon: "🛣️",
        title: "Viajes Foráneos e Intermunicipales",
        desc: "Viaja seguro entre municipios y estados por carretera con choferes experimentados en autopista y vehículos revisados mecánicamente.",
        link: "/traslado-foraneo"
    },
    {
        icon: "👔",
        title: "Cuentas Corporativas",
        desc: "Soluciones de movilidad para empresas y equipos de trabajo con facturación fiscal y control organizado de gastos de traslado."
    },
    {
        icon: "✈️",
        title: "Terminales y Aeropuertos",
        desc: "Traslados confiables y coordinados a centrales de autobuses y aeropuertos locales, asegurando tu llegada puntual."
    },
    {
        icon: "📦",
        title: "Mensajería y Envíos Express",
        desc: "Envío rápido y seguro de paquetes ligeros y documentos importantes dentro de tu ciudad con seguimiento directo."
    }
];

export default function Servicios() {
    return (
        <main className="bg-white">
            <Header />
            <PageHeader
                title="Nuestros Servicios"
                subtitle="Soluciones integrales de movilidad"
                backgroundImage="/images/Serviciosfondo.jpg"
            />

            <section className="py-20 md:py-28 bg-[#F7F7F8]">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-14">
                        <span className="inline-block bg-black text-[#CCFF00] font-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full mb-3">
                            Catálogo de Servicios
                        </span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black font-ui tracking-tight">
                            Soluciones de movilidad para ti
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service, index) => (
                            <div
                                key={index}
                                className="bg-white p-8 rounded-[32px] shadow-sm hover:shadow-xl border border-neutral-200/80 hover:border-black hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-start group"
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                            >
                                <div className="w-14 h-14 rounded-full bg-[#CCFF00] text-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                    {service.icon}
                                </div>
                                {service.link ? (
                                    <Link href={service.link}>
                                        <h3 className="text-xl font-extrabold mb-3 text-black hover:text-neutral-700 font-ui transition-colors cursor-pointer">
                                            {service.title}
                                        </h3>
                                    </Link>
                                ) : (
                                    <h3 className="text-xl font-extrabold mb-3 text-black font-ui">{service.title}</h3>
                                )}
                                <p className="text-neutral-600 text-sm leading-relaxed font-body">{service.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
