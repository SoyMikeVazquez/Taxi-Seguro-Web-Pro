"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, Users, User, LogOut, Search, Bell, Menu, X, FileText, Car, MapPin, Receipt } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isConductor, setIsConductor] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);

        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Determine if user is conductor based on users table
                try {
                const { data } = await supabase.from('users').select('isAdmin, isConductor').eq('correo', user.email).single();
                if (data?.isAdmin) {
                    setIsConductor(false);
                } else if (data?.isConductor) {
                    setIsConductor(true);
                }

                } catch (err) {
                    console.error("Error fetching user role", err);
                }
            } else {
                router.push('/login');
            }
            setLoadingAuth(false);
        };
        checkAuth();

        return () => window.removeEventListener("resize", checkMobile);
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };



    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 w-60 flex-shrink-0 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center justify-between border-b border-gray-100">
                    <Image
                        src="/images/logonormal.png"
                        alt="Taxiseguro Logo"
                        width={140}
                        height={40}
                        className="object-contain"
                        priority
                    />
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-black">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                    {(isConductor ? [
                        { href: "/dashboard/viajes", label: "Mis Viajes", icon: MapPin },
                        { href: "/dashboard", label: "Estadísticas", icon: LayoutDashboard },
                        { href: "/dashboard/perfil", label: "Mi Perfil", icon: User },
                    ] : [
                        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
                        { href: "/dashboard/cotizaciones", label: "Cotizaciones", icon: FileText },
                        { href: "/dashboard/viajes", label: "Viajes", icon: MapPin },
                        { href: "/dashboard/conductores", label: "Conductores", icon: Users },
                        { href: "/dashboard/facturacion", label: "Facturación", icon: Receipt },
                        { href: "/dashboard/vehiculos", label: "Vehículos", icon: Car },
                        { href: "/dashboard/perfil", label: "Mi Perfil", icon: User },
                    ]).map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                                    isActive
                                        ? "bg-gray-100 text-black font-bold"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-black"
                                }`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg w-full transition-colors font-medium"
                    >
                        <LogOut size={20} />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-grow flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-3 w-full max-w-md">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="hidden sm:flex items-center gap-4 bg-gray-100 px-4 py-2 rounded-lg w-full">
                            <Search size={18} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Busca aquí...."
                                className="bg-transparent border-none focus:outline-none text-sm w-full"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                            Ver Web
                        </a>
                        <span className="hidden sm:block bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-mono font-bold">V1.0.0</span>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-grow overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 relative">
                    {children}
                </main>
            </div>
        </div>
    );
}
