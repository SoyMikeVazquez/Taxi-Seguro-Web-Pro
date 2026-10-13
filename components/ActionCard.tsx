"use client";

import { motion } from "framer-motion";
import { MessageSquare, ArrowRight } from "lucide-react";

import { trackEvent } from "@/lib/analytics";

export default function ActionCard() {
    return (
        <section id="descargar-app" className="py-14 sm:py-20 px-3 sm:px-4 bg-white">
            <div className="container mx-auto max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative overflow-hidden rounded-[28px] sm:rounded-[38px] bg-black border border-neutral-800 shadow-2xl p-6 sm:p-10 md:p-16 text-center"
                >
                    {/* Subtle Neon Yellow Glow in background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[220px] sm:h-[300px] bg-[#CCFF00]/10 rounded-full blur-[140px] pointer-events-none" />

                    <div className="relative z-10">
                        <span className="inline-block bg-[#CCFF00] text-black font-extrabold text-xs uppercase tracking-wider px-3.5 sm:px-4 py-1.5 rounded-full mb-4 sm:mb-5 shadow-sm">
                            Disponible en todo México
                        </span>

                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black font-ui text-white tracking-tight mb-3 sm:mb-4 leading-tight">
                            Descarga la App y Pide tu Taxi
                        </h2>
                        <p className="text-sm sm:text-base md:text-lg text-neutral-300 max-w-2xl mx-auto mb-8 sm:mb-10 font-body leading-relaxed">
                            Disponible de forma gratuita en Google Play y App Store. Pide tu taxi en segundos con tarifas claras, seguimiento en tiempo real y conductores verificados.
                        </p>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                            {/* Google Play Button */}
                            <a
                                href="https://play.google.com/store/apps/details?id=com.pideloseguro.usuario&hl=es_MX"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center sm:justify-start gap-3.5 bg-neutral-900 hover:bg-neutral-800 text-white px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl border border-neutral-700 hover:border-[#CCFF00] shadow-xl transition-all duration-200 active:scale-98"
                            >
                                <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 512 512">
                                    <path fill="#00C3FF" d="M49 13.5v485c0 5.7 1.8 10.3 4.8 13.5L274.6 256 53.8 0C50.8 3.2 49 7.8 49 13.5z"/>
                                    <path fill="#00E676" d="M349.5 330.9l-74.9-74.9L53.8 498.5c4.7 2.7 10.7 3.4 17.3 0l278.4-167.6z"/>
                                    <path fill="#FF334B" d="M349.5 181.1L71.1 13.5C64.5 10.1 58.5 10.8 53.8 13.5l220.8 242.5 74.9-74.9z"/>
                                    <path fill="#FFD400" d="M468.9 240.8l-119.4-71.7v173.8l119.4-71.7c11.9-7.1 11.9-23.3 0-30.4z"/>
                                </svg>
                                <div className="text-left">
                                    <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium leading-none">Disponible en</div>
                                    <div className="text-[17px] font-bold leading-tight font-ui text-white">Google Play</div>
                                </div>
                            </a>

                            {/* App Store Button */}
                            <a
                                href="https://apps.apple.com/mx/app/taxiseguro-app-oficial/id6745491422"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3.5 bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3.5 rounded-2xl border border-neutral-700 hover:border-[#CCFF00] shadow-xl transition-all duration-200 hover:scale-[1.03]"
                            >
                                <svg className="w-8 h-8 flex-shrink-0 fill-white" viewBox="0 0 170 170">
                                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.92-12.04-14.52-6.19-9.47-11.1-20.48-14.73-33.03-3.63-12.55-5.46-24.45-5.49-35.7 0-14.34 3.73-26.23 11.19-35.65 7.46-9.42 16.66-14.23 27.6-14.43 4.91 0 10.42 1.35 16.54 4.04 6.12 2.69 10.15 4.11 12.09 4.25 1.57-.14 5.75-1.63 12.54-4.46 6.78-2.84 12.44-4.14 16.98-3.9 12.55.94 22.84 5.95 30.87 15.02-11.04 6.73-16.42 16.03-16.14 27.9.29 9.38 3.99 17.21 11.1 23.5 7.11 6.29 15.65 10.02 25.62 11.2-.95 3.03-2.02 6.13-3.21 9.31zm-32.9-105.15c0-6.12 2.19-11.97 6.57-17.55 4.38-5.58 9.94-9.35 16.68-11.31.29 1.15.43 2.17.43 3.06 0 6.06-2.34 12.04-7.02 17.94-4.68 5.9-10.43 9.49-17.25 10.77-.38-.96-.57-1.93-.57-2.91z"/>
                                </svg>
                                <div className="text-left">
                                    <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium leading-none">Consíguela en</div>
                                    <div className="text-[17px] font-bold leading-tight font-ui text-white">App Store</div>
                                </div>
                            </a>
                        </div>

                        <div className="flex items-center justify-center">
                            <motion.a
                                href="https://api.whatsapp.com/send?phone=528118171792"
                                target="_blank"
                                onClick={() => trackEvent("contacto")}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                className="inline-flex items-center gap-2.5 bg-neutral-900 hover:bg-neutral-800 text-white px-7 py-3.5 rounded-full text-sm font-bold border border-neutral-700 hover:border-[#CCFF00] shadow-lg transition-all"
                            >
                                <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00]"></span>
                                <span>O contáctanos vía WhatsApp</span>
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </motion.a>
                        </div>

                        <p className="mt-6 text-xs text-neutral-400 font-body">
                            Atención y soporte las 24 horas del día
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
