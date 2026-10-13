"use client";

import Image from "next/image";
import Link from "next/link";

export default function About() {
    return (
        <section id="nosotros" className="bg-white py-14 sm:py-20 md:py-28 overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-6xl">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">

                    {/* Text Content - Left Side */}
                    <div className="w-full lg:w-1/2">
                        <span className="inline-block bg-neutral-100 text-neutral-900 font-bold text-xs uppercase tracking-wider px-3.5 sm:px-4 py-1.5 rounded-full mb-3 sm:mb-4">
                            ¿Quiénes somos? | App Taxiseguro
                        </span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black leading-[1.15] mb-4 sm:mb-6 font-ui tracking-tight">
                            La forma más fácil y segura de moverte en taxi
                        </h2>

                        <div className="prose prose-base sm:prose-lg text-neutral-600 font-body mb-6 sm:mb-8 leading-relaxed space-y-3 sm:space-y-4">
                            <p>
                                En <strong className="text-black font-extrabold">Taxiseguro</strong> conectamos a pasajeros con taxistas formales y autorizados directamente desde su celular. Nuestra plataforma está diseñada para que pedir un taxi sea tan sencillo como abrir la app, ingresar tu destino y disfrutar de un viaje cómodo, puntual y seguro.
                            </p>
                            <p>
                                Todos nuestros conductores cuentan con <strong className="text-black font-extrabold">identidad verificada y unidades en óptimas condiciones</strong>, brindándote la certeza de un viaje protegido y con tarifas transparentes en cada trayecto.
                            </p>
                        </div>

                        <a
                            href="#descargar-app"
                            className="w-full sm:w-auto inline-flex items-center justify-center bg-black hover:bg-neutral-900 text-white font-bold py-3.5 px-7 rounded-full transition-all duration-300 text-sm sm:text-base shadow-xl group border border-neutral-800"
                        >
                            <span>Pide tu taxi desde la app</span>
                            <span className="ml-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#CCFF00] text-black flex items-center justify-center font-black group-hover:translate-x-1 transition-transform text-xs sm:text-sm">
                                →
                            </span>
                        </a>
                    </div>

                    {/* Image - Right Side */}
                    <div className="w-full lg:w-1/2">
                        <div className="relative w-full h-[280px] sm:h-[400px] lg:h-[540px] rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-2xl border-4 border-neutral-100">
                            <Image
                                src="/images/pasajero-app-taxi.jpg"
                                alt="Pasajero viajando en taxi con la app Taxiseguro"
                                fill
                                className="object-cover object-center"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
