"use client";

import { motion } from "framer-motion";

const ZONES = [
    {
        name: "Zona A",
        description: "Zona Centro y Comercial",
        price: "Tarifa Local",
    },
    {
        name: "Zona B",
        description: "Área Urbana y Residencial",
        price: "Tarifa Media",
    },
    {
        name: "Zona C",
        description: "Zona Conurbada / Intermunicipal",
        price: "Tarifa Especial",
    },
    {
        name: "Zona D",
        description: "Terminales y Zonas Periféricas",
        price: "Tarifa Periférica",
    }
];

export default function PriceCards() {
    return (
        <section className="bg-white py-[80px]">
            <div className="container-legacy">
                <motion.div className="text-center mb-[50px]">
                    <h2 className="text-[2.5rem] font-bold text-primary font-ui">
                        Modalidades de servicio por zona
                    </h2>
                </motion.div>

                {/* Simulating the table look with cards/grid as requested but keeping it simple/strict */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[30px]">
                    {ZONES.map((zone, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-[10px] shadow-[0_5px_15px_rgba(0,0,0,0.08)] overflow-hidden border border-[#eee]"
                        >
                            <div className="bg-primary p-[15px] text-white font-medium font-ui text-center">
                                {zone.name}
                            </div>
                            <div className="p-[20px] text-center">
                                <p className="text-text-main text-sm mb-4 h-10">{zone.description}</p>
                                <div className="text-3xl font-bold text-primary font-ui mb-4">
                                    {zone.price}
                                </div>
                                <button className="w-full bg-secondary text-white py-[10px] rounded-[5px] font-bold font-ui hover:bg-[#9a7324] transition-colors">
                                    Reservar
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
