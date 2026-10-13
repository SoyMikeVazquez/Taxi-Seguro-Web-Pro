"use client";

import PageHeader from "@/components/PageHeader";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const values = [
    { title: "Seguridad", desc: "Nuestra prioridad número uno en cada viaje." },
    { title: "Servicio", desc: "Atención cálida y personalizada siempre." },
    { title: "Compromiso", desc: "Cumplimos lo que prometemos, siempre." },
    { title: "Puntualidad", desc: "Respetamos tu tiempo como el recurso más valioso." },
    { title: "Honestidad", desc: "Transparencia en tarifas y tratos." }
];

export default function Nosotros() {
    return (
        <main className="bg-white">
            <Header />
            <PageHeader
                title="Sobre Nosotros"
                backgroundImage="/images/Untitled-design-3-1.png"
            />

            {/* History & Mission */}
            <section className="py-20 md:py-28">
                <div className="container mx-auto px-4 max-w-4xl text-center md:text-left">
                    <div data-aos="fade-up">
                        <span className="inline-block bg-neutral-100 text-black font-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
                            Nuestra Identidad
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black mb-6 text-black font-ui tracking-tight">¿Quiénes Somos?</h2>
                        <p className="text-neutral-600 mb-8 leading-relaxed text-lg font-body">
                            En Taxiseguro nacimos con el objetivo de hacer que pedir un taxi sea una experiencia fácil, rápida y completamente segura. Desarrollamos una aplicación móvil y web intuitiva que te permite solicitar tu taxi en minutos desde tu celular, garantizando viajes cómodos, choferes profesionales verificados y tarifas transparentes sin sorpresas.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mt-12">
                        <div className="bg-[#0A0A0A] text-white p-8 rounded-[32px] border border-neutral-800 shadow-xl" data-aos="fade-right">
                            <div className="w-10 h-10 rounded-full bg-[#CCFF00] text-black font-black flex items-center justify-center mb-4 text-sm">
                                01
                            </div>
                            <h3 className="text-xl font-extrabold mb-3 text-white font-ui">Misión</h3>
                            <p className="text-neutral-400 leading-relaxed text-sm font-body">
                                Brindar a los usuarios una alternativa de transporte moderna, puntual y confiable mediante tecnología ágil, asegurando que cada viaje cumpla con los más altos estándares de calidad, seguridad y atención al pasajero.
                            </p>
                        </div>
                        <div className="bg-[#0A0A0A] text-white p-8 rounded-[32px] border border-neutral-800 shadow-xl" data-aos="fade-left">
                            <div className="w-10 h-10 rounded-full bg-[#CCFF00] text-black font-black flex items-center justify-center mb-4 text-sm">
                                02
                            </div>
                            <h3 className="text-xl font-extrabold mb-3 text-white font-ui">Visión</h3>
                            <p className="text-neutral-400 leading-relaxed text-sm font-body">
                                Consolidarnos como la app de taxis favorita de los pasajeros en México, reconocida por la seguridad de sus viajes, la confianza de sus conductores y una atención de excelencia.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 bg-[#F7F7F8]">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-black text-black font-ui tracking-tight">Nuestros Valores</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
                        {values.map((val, index) => (
                            <div
                                key={index}
                                className="bg-white p-7 rounded-[28px] border border-neutral-200/80 shadow-sm hover:shadow-lg hover:border-black transition-all text-center flex flex-col items-center group"
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                            >
                                <span className="w-10 h-10 rounded-full bg-[#CCFF00] text-black flex items-center justify-center font-bold text-sm mb-4 group-hover:scale-110 transition-transform">
                                    ★
                                </span>
                                <h4 className="text-lg font-bold mb-2 text-black font-ui">{val.title}</h4>
                                <p className="text-xs text-neutral-600 leading-relaxed font-body">{val.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-black text-white text-center border-t border-neutral-900">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl sm:text-4xl font-black mb-4 font-ui">¿Listo para viajar seguro?</h2>
                    <p className="text-lg text-neutral-300 mb-8 max-w-xl mx-auto">Pide tu taxi desde la app móvil o haz tu reserva al instante.</p>
                    <Link
                        href="/reservar"
                        className="inline-flex items-center gap-2 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black py-4 px-10 rounded-full transition-all text-base shadow-lg hover:scale-105"
                    >
                        <span>Pedir un viaje</span>
                        <span>→</span>
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}
