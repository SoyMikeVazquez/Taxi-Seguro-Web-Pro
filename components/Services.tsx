"use client";

import { motion } from "framer-motion";
import { Smartphone, ShieldCheck, Navigation, ReceiptText } from "lucide-react";

export default function WhyChooseUs() {
    const features = [
        {
            title: "Pide en Segundos",
            description: "Solicita tu unidad al instante desde tu teléfono o programa tu viaje con anticipación.",
            icon: Smartphone
        },
        {
            title: "Choferes Verificados",
            description: "Conductores profesionales con antecedentes revisados e identidad validada.",
            icon: ShieldCheck
        },
        {
            title: "Rutas Monitoreadas",
            description: "Seguimiento satelital en tiempo real durante todo el trayecto para tu máxima seguridad.",
            icon: Navigation
        },
        {
            title: "Tarifas Transparentes",
            description: "Precios claros y justos antes de abordar, sin cargos sorpresa ni tarifas abusivas.",
            icon: ReceiptText
        }
    ];

    return (
        <section id="beneficios" className="bg-[#F7F7F8] py-14 sm:py-20 px-4 sm:px-6">
            <div className="container mx-auto max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10 sm:mb-14"
                >
                    <span className="inline-block bg-black text-[#CCFF00] font-bold text-xs uppercase tracking-wider px-3.5 sm:px-4 py-1.5 rounded-full mb-3">
                        Ventajas de Taxiseguro
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black font-ui tracking-tight">
                        ¿Por qué pedir tu taxi con nuestra app?
                    </h2>
                    <p className="text-neutral-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mt-2.5 sm:mt-3 font-body">
                        Combinamos la comodidad de la tecnología móvil con taxis formales y seguros en todo momento.
                    </p>
                </motion.div>

                {/* Modern Rounded Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 25 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, duration: 0.4 }}
                                className="bg-white rounded-[32px] p-7 border border-neutral-200/80 shadow-sm hover:shadow-xl hover:border-black transition-all duration-300 flex flex-col items-start group"
                            >
                                {/* Neon Yellow Circular Icon Badge */}
                                <div className="w-14 h-14 rounded-full bg-[#CCFF00] text-black flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                    <Icon className="w-7 h-7 stroke-[2.2]" />
                                </div>

                                {/* Text */}
                                <h3 className="text-xl font-extrabold text-black font-ui tracking-tight mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-neutral-600 text-sm leading-relaxed font-body">
                                    {feature.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
