"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Phone, MessageSquare, CarFront, Search } from "lucide-react"; // Screenshot shows phone icon and whatsapp icon

import { trackEvent } from "@/lib/analytics";

export default function Hero() {
    return (
        <div id="inicio" className="relative min-h-screen w-full overflow-hidden bg-black flex items-center pt-20 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/chofer.jpg"
                    alt="Chofer Taxiseguro"
                    fill
                    className="object-cover opacity-40 scale-105"
                    priority
                />
                {/* Dark Vignette & Gradient Overlay */}
                <div
                    className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60"
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full">
                <div className="container mx-auto px-4 sm:px-6 md:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        {/* Left column: Hero texts and CTAs */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: { staggerChildren: 0.15 }
                                }
                            }}
                            className="lg:col-span-7 text-left"
                        >
                            {/* App Badge */}
                            <motion.div
                                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                                className="inline-flex items-center gap-2 sm:gap-2.5 bg-neutral-900/90 border border-neutral-800 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 backdrop-blur-md"
                            >
                                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#CCFF00] shadow-[0_0_8px_#CCFF00]"></span>
                                <span className="text-white text-xs sm:text-sm font-semibold tracking-wide">
                                    App Oficial de Taxis en México
                                </span>
                            </motion.div>

                            <motion.h1
                                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white font-ui tracking-tight leading-[1.12] mb-4 sm:mb-6"
                            >
                                Tu taxi seguro al instante.{" "}
                                <span className="text-[#CCFF00] block mt-1">Pide tu viaje desde la app.</span>
                            </motion.h1>

                            <motion.p
                                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                                className="text-sm sm:text-base md:text-lg text-neutral-300 mb-8 sm:mb-10 font-body max-w-xl leading-relaxed"
                            >
                                Muévete con total tranquilidad. Solicita tu taxi en segundos desde tu teléfono, viaja con conductores profesionales verificados y disfruta de tarifas claras sin sorpresas.
                            </motion.p>

                            {/* Download App Buttons: Android & iOS */}
                            <motion.div
                                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
                            >
                                {/* Google Play Button */}
                                <a
                                    href="https://play.google.com/store/apps/details?id=com.pideloseguro.usuario&hl=es_MX"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center sm:justify-start gap-3.5 bg-neutral-900 hover:bg-neutral-800 text-white px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl border border-neutral-700 hover:border-[#CCFF00] shadow-xl transition-all duration-200 active:scale-98 group"
                                >
                                    <svg className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0" viewBox="0 0 512 512">
                                        <path fill="#00C3FF" d="M49 13.5v485c0 5.7 1.8 10.3 4.8 13.5L274.6 256 53.8 0C50.8 3.2 49 7.8 49 13.5z"/>
                                        <path fill="#00E676" d="M349.5 330.9l-74.9-74.9L53.8 498.5c4.7 2.7 10.7 3.4 17.3 0l278.4-167.6z"/>
                                        <path fill="#FF334B" d="M349.5 181.1L71.1 13.5C64.5 10.1 58.5 10.8 53.8 13.5l220.8 242.5 74.9-74.9z"/>
                                        <path fill="#FFD400" d="M468.9 240.8l-119.4-71.7v173.8l119.4-71.7c11.9-7.1 11.9-23.3 0-30.4z"/>
                                    </svg>
                                    <div className="text-left">
                                        <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium leading-none">Disponible en</div>
                                        <div className="text-[16px] sm:text-[17px] font-bold leading-tight font-ui text-white">Google Play</div>
                                    </div>
                                </a>

                                {/* App Store Button */}
                                <a
                                    href="https://apps.apple.com/mx/app/taxiseguro-app-oficial/id6745491422"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center sm:justify-start gap-3.5 bg-neutral-900 hover:bg-neutral-800 text-white px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl border border-neutral-700 hover:border-[#CCFF00] shadow-xl transition-all duration-200 active:scale-98 group"
                                >
                                    <svg className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 fill-white" viewBox="0 0 170 170">
                                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.92-12.04-14.52-6.19-9.47-11.1-20.48-14.73-33.03-3.63-12.55-5.46-24.45-5.49-35.7 0-14.34 3.73-26.23 11.19-35.65 7.46-9.42 16.66-14.23 27.6-14.43 4.91 0 10.42 1.35 16.54 4.04 6.12 2.69 10.15 4.11 12.09 4.25 1.57-.14 5.75-1.63 12.54-4.46 6.78-2.84 12.44-4.14 16.98-3.9 12.55.94 22.84 5.95 30.87 15.02-11.04 6.73-16.42 16.03-16.14 27.9.29 9.38 3.99 17.21 11.1 23.5 7.11 6.29 15.65 10.02 25.62 11.2-.95 3.03-2.02 6.13-3.21 9.31zm-32.9-105.15c0-6.12 2.19-11.97 6.57-17.55 4.38-5.58 9.94-9.35 16.68-11.31.29 1.15.43 2.17.43 3.06 0 6.06-2.34 12.04-7.02 17.94-4.68 5.9-10.43 9.49-17.25 10.77-.38-.96-.57-1.93-.57-2.91z"/>
                                    </svg>
                                    <div className="text-left">
                                        <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium leading-none">Consíguela en</div>
                                        <div className="text-[16px] sm:text-[17px] font-bold leading-tight font-ui text-white">App Store</div>
                                    </div>
                                </a>
                            </motion.div>
                        </motion.div>

                        {/* Right column: Interactive App Mockup Card (Derived directly from app reference) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="lg:col-span-5 flex justify-center mt-6 lg:mt-0 w-full"
                        >
                            <div className="w-full max-w-[340px] sm:max-w-[360px] bg-white text-black rounded-[32px] sm:rounded-[36px] p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border-4 border-neutral-900">
                                {/* App Header */}
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <div>
                                        <span className="text-xs text-neutral-400 font-medium">Sugerencia de hoy</span>
                                        <h3 className="text-xl sm:text-2xl font-black font-ui tracking-tight text-black">
                                            Buenos días
                                        </h3>
                                    </div>
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#CCFF00] flex items-center justify-center text-black shadow-sm font-bold">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 10.9 2 11v5c0 .6.4 1 1 1h2" />
                                            <circle cx="7" cy="17" r="2" />
                                            <path d="M9 17h6" />
                                            <circle cx="17" cy="17" r="2" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Dark Mini-Map Preview */}
                                <div className="relative h-36 sm:h-44 w-full rounded-[24px] sm:rounded-[28px] overflow-hidden bg-neutral-950 border border-neutral-200 mb-3 sm:mb-4 flex items-center justify-center shadow-inner">
                                    {/* Stylized dark map grid lines */}
                                    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                                    <div className="absolute w-3/4 h-0.5 bg-neutral-700/60 rotate-45"></div>
                                    <div className="absolute w-full h-0.5 bg-neutral-700/60 -rotate-12"></div>

                                    {/* Neon Yellow Taxi Pin */}
                                    <div className="relative z-10 flex items-center justify-center">
                                        <span className="absolute w-12 h-12 rounded-full bg-[#CCFF00]/30 animate-ping"></span>
                                        <div className="w-7 h-7 rounded-full bg-[#CCFF00] border-2 border-black flex items-center justify-center shadow-lg">
                                            <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
                                        </div>
                                    </div>

                                    {/* Mini action buttons inside map */}
                                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-bold text-neutral-800">
                                            ⚲
                                        </div>
                                    </div>
                                </div>

                                {/* Pedir un viaje - Signature Lime Pill Button */}
                                <a
                                    href="https://play.google.com/store/apps/details?id=com.pideloseguro.usuario&hl=es_MX"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black p-4 rounded-[26px] flex items-center justify-between shadow-md transition-all hover:scale-[1.02] mb-3 group"
                                >
                                    <div className="text-left">
                                        <div className="text-lg font-black font-ui leading-tight text-black">
                                            Pedir un viaje
                                        </div>
                                        <div className="text-xs text-neutral-800 font-semibold mt-0.5">
                                            Auto más cercano a 2 min
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-base font-bold group-hover:translate-x-1 transition-transform">
                                        →
                                    </div>
                                </a>

                                {/* Card: Viaja con nosotros */}
                                <div className="w-full bg-neutral-950 text-white p-3.5 rounded-[22px] flex items-center justify-between">
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-white">Viaja con nosotros</div>
                                        <div className="text-[11px] text-neutral-400">Listos para atenderte 24/7</div>
                                    </div>
                                    <span className="text-xs font-bold text-[#CCFF00] bg-neutral-900 px-2.5 py-1 rounded-full border border-neutral-800">
                                        Seguro
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
