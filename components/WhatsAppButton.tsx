"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

export default function WhatsAppButton() {
  const pathname = usePathname();

  // Hide the button if the user is in the dashboard
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <a
      href="https://api.whatsapp.com/send?phone=528118171792"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacto y Asistencia"
      className="fixed bottom-6 right-6 z-[30] hover:scale-105 transition-all duration-300 group"
    >
      <div className="relative w-14 h-14 rounded-full bg-black border-2 border-neutral-800 hover:border-[#CCFF00] shadow-2xl flex items-center justify-center text-white group-hover:text-[#CCFF00] transition-colors">
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#CCFF00] border-2 border-black animate-pulse"></span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
    </a>
  );
}
