"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect logic as requested
    if (pathname.startsWith('/dashboard')) {
      router.push('/login');
    } else {
      router.push('/');
    }
  }, [pathname, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black tracking-widest text-gray-400 uppercase">Cargando...</p>
      </div>
    </div>
  );
}
