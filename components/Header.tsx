"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [mobileMenuOpen]);

    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
                scrolled
                    ? "bg-black/95 backdrop-blur-md py-2.5 sm:py-3 shadow-xl border-b border-neutral-900"
                    : "bg-gradient-to-b from-black/95 via-black/60 to-transparent py-3 sm:py-4"
            }`}
        >
            <div className="container mx-auto px-4 sm:px-6 md:px-8 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="relative w-36 h-9 sm:w-44 sm:h-11 z-50 flex items-center">
                    <Image
                        src="/images/logoblanco.png"
                        alt="Taxiseguro Logo"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </Link>

                {/* Desktop Nav Links (Single Landing Page Sections) */}
                <nav className="hidden lg:flex items-center gap-8">
                    <a href="#beneficios" className="text-white/80 text-[15px] font-semibold font-ui hover:text-[#CCFF00] transition-colors">
                        Beneficios
                    </a>
                    <a href="#nosotros" className="text-white/80 text-[15px] font-semibold font-ui hover:text-[#CCFF00] transition-colors">
                        Nosotros
                    </a>
                    <a href="#descargar-app" className="text-white/80 text-[15px] font-semibold font-ui hover:text-[#CCFF00] transition-colors">
                        Descargar App
                    </a>
                </nav>

                {/* Desktop Action Button */}
                <div className="hidden lg:flex items-center gap-3">
                    <a
                        href="#descargar-app"
                        className="inline-flex items-center gap-2 bg-[#CCFF00] hover:bg-[#bbf000] text-black font-extrabold text-sm px-5 py-2.5 rounded-full shadow-md transition-all duration-200 hover:scale-105"
                    >
                        <span>Pedir un viaje</span>
                        <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-xs">→</span>
                    </a>
                </div>

                {/* Mobile Header Right: Quick CTA + Hamburger */}
                <div className="flex lg:hidden items-center gap-2.5 z-50">
                    <a
                        href="#descargar-app"
                        className="inline-flex items-center gap-1.5 bg-[#CCFF00] active:scale-95 text-black font-black text-xs px-3.5 py-1.5 rounded-full shadow-sm transition-transform"
                    >
                        <span>Pedir viaje</span>
                        <span>→</span>
                    </a>
                    <button
                        className="text-white p-2 rounded-full bg-neutral-900 border border-neutral-800 focus:outline-none"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                <div
                    className={`fixed inset-0 bg-black/95 backdrop-blur-2xl z-[60] flex flex-col items-center justify-center transition-all duration-300 lg:hidden px-6 ${
                        mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                    }`}
                >
                    <nav className="flex flex-col items-center gap-7 text-center w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <a
                            href="#"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-white text-2xl font-black font-ui hover:text-[#CCFF00] transition-colors"
                        >
                            Inicio
                        </a>
                        <a
                            href="#beneficios"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-white/90 text-xl font-bold font-ui hover:text-[#CCFF00] transition-colors"
                        >
                            Beneficios
                        </a>
                        <a
                            href="#nosotros"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-white/90 text-xl font-bold font-ui hover:text-[#CCFF00] transition-colors"
                        >
                            Sobre Nosotros
                        </a>
                        <a
                            href="#descargar-app"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-white/90 text-xl font-bold font-ui hover:text-[#CCFF00] transition-colors"
                        >
                            Descargar App
                        </a>

                        <div className="w-full pt-8 border-t border-neutral-800 flex flex-col gap-3">
                            <a
                                href="https://play.google.com/store/apps/details?id=com.pideloseguro.usuario&hl=es_MX"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full bg-[#CCFF00] active:scale-95 text-black font-extrabold py-3.5 px-6 rounded-full text-center flex items-center justify-center gap-2 shadow-md transition-transform text-sm"
                            >
                                <span>Descargar en Google Play</span>
                                <span>→</span>
                            </a>
                            <a
                                href="https://apps.apple.com/mx/app/taxiseguro-app-oficial/id6745491422"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full bg-neutral-900 border border-neutral-700 text-white font-bold py-3.5 px-6 rounded-full text-center flex items-center justify-center gap-2 active:scale-95 transition-transform text-sm"
                            >
                                <span>Descargar en App Store</span>
                                <span>→</span>
                            </a>
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
}
