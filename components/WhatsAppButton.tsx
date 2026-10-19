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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="fill-current">
          <path d="M17.472 14.382C17.112 14.011 16.351 13.527 15.93 13.344C15.344 13.111 15.179 13.116 14.869 13.565C14.509 14.045 14.168 14.512 13.924 14.577C13.681 14.639 12.986 14.28 12.158 13.543C11.517 12.973 11.059 12.28 10.925 12.034C10.749 11.705 10.976 11.56 11.233 11.234C11.458 10.95 11.585 10.748 11.71 10.493C11.834 10.237 11.751 10.046 11.668 9.878C11.585 9.711 10.957 8.163 10.686 7.558C10.395 6.908 10.125 7.029 9.905 7.029C9.704 7.029 9.473 7.024 9.243 7.024C8.751 7.024 8.243 7.218 7.915 7.575C7.587 7.933 6.643 8.799 6.643 10.59C6.643 12.38 7.946 14.113 8.134 14.367C8.322 14.622 10.758 18.369 14.489 19.982C15.377 20.366 16.069 20.595 16.602 20.764C17.555 21.066 18.423 21.025 19.106 20.923C19.866 20.809 21.446 19.966 21.77 19.055C22.094 18.145 22.094 17.362 22.015 17.229C21.936 17.095 21.734 17.017 21.435 16.868L17.472 14.382ZM12.04 23.633C12.038 23.633 12.035 23.633 12.033 23.633C10.264 23.632 8.5273 23.1818 6.9793 22.3308L6.6093 22.1268L2.7303 23.1448L3.7913 19.3868L3.5513 19.0048C2.6283 17.5348 2.1433 15.8458 2.1453 14.1288C2.1503 8.6828 6.5823 4.2518 12.0313 4.2518C14.6713 4.2528 17.1523 5.2808 19.0193 7.1478C20.8863 9.0148 21.9143 11.4968 21.9133 14.1368C21.9083 19.5888 17.4833 24.0188 12.0403 24.0188L12.04 23.633Z" />
        </svg>
      </div>
    </a>
  );
}
