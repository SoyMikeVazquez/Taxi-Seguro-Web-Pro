"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function Footer() {
    return (
        <footer className="bg-[#0A0A0A] text-white pt-16 pb-10 border-t border-neutral-900 relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
                    {/* Col 1: Logo & Info */}
                    <div className="flex flex-col items-start space-y-4">
                        <div className="relative w-44 h-12">
                            <Image
                                src="/images/logoblanco.png"
                                alt="Taxiseguro"
                                fill
                                className="object-contain object-left"
                            />
                        </div>
                        <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
                            Tu app confiable para pedir taxis seguros y al instante desde tu celular. Choferes profesionales y tarifas transparentes en México.
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse"></span>
                            <span>Disponible en la República Mexicana</span>
                        </div>
                    </div>

                    {/* Col 2: Enlaces rápidos */}
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-white mb-5 font-ui">
                            Navegación
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a href="#inicio" className="text-neutral-400 hover:text-[#CCFF00] transition-colors">
                                    Inicio
                                </a>
                            </li>
                            <li>
                                <a href="#beneficios" className="text-neutral-400 hover:text-[#CCFF00] transition-colors">
                                    Beneficios de la App
                                </a>
                            </li>
                            <li>
                                <a href="#nosotros" className="text-neutral-400 hover:text-[#CCFF00] transition-colors">
                                    Sobre Nosotros
                                </a>
                            </li>
                            <li>
                                <a href="#descargar-app" className="text-neutral-400 hover:text-[#CCFF00] transition-colors">
                                    Descargar App
                                </a>
                            </li>
                            <li>
                                <Link href="/politica-de-privacidad" className="text-neutral-500 hover:text-[#CCFF00] transition-colors">
                                    Aviso de Privacidad
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Col 3: Descarga la App & Redes */}
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-white mb-5 font-ui">
                            Descarga la App
                        </h4>
                        <div className="flex flex-col sm:flex-row md:flex-col gap-3 mb-6">
                            <a
                                href="https://play.google.com/store/apps/details?id=com.pideloseguro.usuario&hl=es_MX"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-2xl border border-neutral-800 hover:border-[#CCFF00]/60 transition-all group"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 512 512">
                                    <path fill="#00C3FF" d="M49 13.5v485c0 5.7 1.8 10.3 4.8 13.5L274.6 256 53.8 0C50.8 3.2 49 7.8 49 13.5z"/>
                                    <path fill="#00E676" d="M349.5 330.9l-74.9-74.9L53.8 498.5c4.7 2.7 10.7 3.4 17.3 0l278.4-167.6z"/>
                                    <path fill="#FF334B" d="M349.5 181.1L71.1 13.5C64.5 10.1 58.5 10.8 53.8 13.5l220.8 242.5 74.9-74.9z"/>
                                    <path fill="#FFD400" d="M468.9 240.8l-119.4-71.7v173.8l119.4-71.7c11.9-7.1 11.9-23.3 0-30.4z"/>
                                </svg>
                                <div className="text-left">
                                    <div className="text-[10px] uppercase tracking-wider text-neutral-400 group-hover:text-neutral-300">Disponible en</div>
                                    <div className="text-xs font-bold leading-tight">Google Play</div>
                                </div>
                            </a>

                            <a
                                href="https://apps.apple.com/mx/app/taxiseguro-app-oficial/id6745491422"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-2xl border border-neutral-800 hover:border-[#CCFF00]/60 transition-all group"
                            >
                                <svg className="w-5 h-5 flex-shrink-0 fill-white" viewBox="0 0 170 170">
                                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.92-12.04-14.52-6.19-9.47-11.1-20.48-14.73-33.03-3.63-12.55-5.46-24.45-5.49-35.7 0-14.34 3.73-26.23 11.19-35.65 7.46-9.42 16.66-14.23 27.6-14.43 4.91 0 10.42 1.35 16.54 4.04 6.12 2.69 10.15 4.11 12.09 4.25 1.57-.14 5.75-1.63 12.54-4.46 6.78-2.84 12.44-4.14 16.98-3.9 12.55.94 22.84 5.95 30.87 15.02-11.04 6.73-16.42 16.03-16.14 27.9.29 9.38 3.99 17.21 11.1 23.5 7.11 6.29 15.65 10.02 25.62 11.2-.95 3.03-2.02 6.13-3.21 9.31zm-32.9-105.15c0-6.12 2.19-11.97 6.57-17.55 4.38-5.58 9.94-9.35 16.68-11.31.29 1.15.43 2.17.43 3.06 0 6.06-2.34 12.04-7.02 17.94-4.68 5.9-10.43 9.49-17.25 10.77-.38-.96-.57-1.93-.57-2.91z"/>
                                </svg>
                                <div className="text-left">
                                    <div className="text-[10px] uppercase tracking-wider text-neutral-400 group-hover:text-neutral-300">Consíguela en</div>
                                    <div className="text-xs font-bold leading-tight">App Store</div>
                                </div>
                            </a>
                        </div>

                        <div>
                            <h5 className="font-semibold text-xs uppercase tracking-wider text-neutral-400 mb-3">Síguenos</h5>
                            <div className="flex gap-2.5">
                                <a
                                     href="https://www.facebook.com/TaxiSeguroOficial"
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     aria-label="Facebook"
                                     className="bg-neutral-900 border border-neutral-800 w-10 h-10 rounded-full flex items-center justify-center text-neutral-300 hover:bg-[#CCFF00] hover:text-black hover:border-[#CCFF00] transition-colors"
                                >
                                    <Facebook className="w-4 h-4" />
                                </a>
                                <a
                                     href="https://api.whatsapp.com/send?phone=528118171792"
                                     target="_blank"
                                     onClick={() => trackEvent("contacto")}
                                     rel="noopener noreferrer"
                                     aria-label="WhatsApp"
                                     className="bg-neutral-900 border border-neutral-800 w-10 h-10 rounded-full flex items-center justify-center text-neutral-300 hover:bg-[#CCFF00] hover:text-black hover:border-[#CCFF00] transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-current">
                                        <path d="M17.472 14.382C17.112 14.011 16.351 13.527 15.93 13.344C15.344 13.111 15.179 13.116 14.869 13.565C14.509 14.045 14.168 14.512 13.924 14.577C13.681 14.639 12.986 14.28 12.158 13.543C11.517 12.973 11.059 12.28 10.925 12.034C10.749 11.705 10.976 11.56 11.233 11.234C11.458 10.95 11.585 10.748 11.71 10.493C11.834 10.237 11.751 10.046 11.668 9.878C11.585 9.711 10.957 8.163 10.686 7.558C10.395 6.908 10.125 7.029 9.905 7.029C9.704 7.029 9.473 7.024 9.243 7.024C8.751 7.024 8.243 7.218 7.915 7.575C7.587 7.933 6.643 8.799 6.643 10.59C6.643 12.38 7.946 14.113 8.134 14.367C8.322 14.622 10.758 18.369 14.489 19.982C15.377 20.366 16.069 20.595 16.602 20.764C17.555 21.066 18.423 21.025 19.106 20.923C19.866 20.809 21.446 19.966 21.77 19.055C22.094 18.145 22.094 17.362 22.015 17.229C21.936 17.095 21.734 17.017 21.435 16.868L17.472 14.382ZM12.04 23.633C12.038 23.633 12.035 23.633 12.033 23.633C10.264 23.632 8.5273 23.1818 6.9793 22.3308L6.6093 22.1268L2.7303 23.1448L3.7913 19.3868L3.5513 19.0048C2.6283 17.5348 2.1433 15.8458 2.1453 14.1288C2.1503 8.6828 6.5823 4.2518 12.0313 4.2518C14.6713 4.2528 17.1523 5.2808 19.0193 7.1478C20.8863 9.0148 21.9143 11.4968 21.9133 14.1368C21.9083 19.5888 17.4833 24.0188 12.0403 24.0188L12.04 23.633Z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-14 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
                    <p>
                        &copy; {new Date().getFullYear()} Taxiseguro. Todos los derechos reservados.
                    </p>
                    <p className="text-[11px] text-neutral-600 font-mono tracking-wider">
                        TU APP DE TAXI EN MÉXICO
                    </p>
                </div>
            </div>
        </footer>
    );
}
