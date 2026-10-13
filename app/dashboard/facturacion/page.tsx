"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    FileText,
    Calendar,
    CheckCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    Search,
    CreditCard,
    MapPin,
    Mail,
    Phone
} from "lucide-react";

export default function DashboardFacturacionPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const getCurrentWeek = () => {
        const d = new Date();
        const start = new Date(d.setDate(d.getDate() - d.getDay() + 1));
        const end = new Date(d.setDate(d.getDate() - d.getDay() + 7));
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    };
    
    const [startDate, setStartDate] = useState<string>(getCurrentWeek().start);
    const [endDate, setEndDate] = useState<string>(getCurrentWeek().end);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const { data, error } = await supabase
                .from('facturacion')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInvoices(data || []);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const updateStatus = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from('facturacion')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setInvoices(prev => prev.map(inv =>
                inv.id === id ? { ...inv, status: newStatus } : inv
            ));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error al actualizar el estado");
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Facturación</h1>
                    <p className="text-gray-500">Administra las solicitudes de factura de los clientes</p>
                </div>
                <div className="flex flex-col md:flex-row items-end gap-4">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 px-3 py-1">
                            <span className="text-xs font-bold text-gray-400">DESDE</span>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none" />
                        </div>
                        <div className="w-px h-6 bg-gray-200"></div>
                        <div className="flex items-center gap-2 px-3 py-1">
                            <span className="text-xs font-bold text-gray-400">HASTA</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none" />
                        </div>
                    </div>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por RFC o Razón Social..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {invoices.filter(inv => {
                    // Date Filter
                    if (startDate && endDate) {
                        try {
                            const targetDate = new Date(inv.fecha_servicio || inv.created_at);
                            if (!isNaN(targetDate.getTime())) {
                                const dStr = targetDate.toISOString().split('T')[0];
                                if (dStr < startDate || dStr > endDate) return false;
                            }
                        } catch (e) { return false; }
                    }
                    
                    // Search Filter
                    if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        if (!inv.razon_social?.toLowerCase().includes(q) && !inv.rfc?.toLowerCase().includes(q)) {
                            return false;
                        }
                    }
                    return true;
                }).map((invoice) => (
                    <div
                        key={invoice.id}
                        className={`bg-white rounded-xl border transition-all duration-200 ${expandedIds.includes(invoice.id) ? 'border-black shadow-md' : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        {/* Card Header (Always Visible) */}
                        <div
                            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                            onClick={() => toggleExpand(invoice.id)}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full ${invoice.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                    }`}>
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{invoice.razon_social}</h3>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <CreditCard size={14} />
                                            {invoice.rfc}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(invoice.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${invoice.status === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {invoice.status === 'completed' ? (
                                        <>
                                            <CheckCircle size={12} />
                                            Completado
                                        </>
                                    ) : (
                                        <>
                                            <Clock size={12} />
                                            Pendiente
                                        </>
                                    )}
                                </div>
                                {expandedIds.includes(invoice.id) ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedIds.includes(invoice.id) && (
                            <div className="px-5 pb-5 pt-0 border-t border-gray-100 mt-2 bg-gray-50/50 rounded-b-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                                    {/* Column 1: Billing Details */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                                            <FileText size={16} />
                                            Datos Fiscales
                                        </h4>
                                        <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                                            <span className="text-gray-500">Razón Social:</span>
                                            <span className="font-medium text-gray-900">{invoice.razon_social}</span>

                                            <span className="text-gray-500">RFC:</span>
                                            <span className="font-medium text-gray-900">{invoice.rfc}</span>

                                            <span className="text-gray-500">Régimen:</span>
                                            <span className="text-gray-900">{invoice.regimen_fiscal || '-'}</span>

                                            <span className="text-gray-500">Uso CFDI:</span>
                                            <span className="text-gray-900">{invoice.uso_cfdi || '-'}</span>

                                            <span className="text-gray-500">Dirección:</span>
                                            <span className="text-gray-900">
                                                {invoice.calle} {invoice.numero_exterior}, {invoice.colonia}<br />
                                                {invoice.municipio}, {invoice.estado} CP {invoice.codigo_postal}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Column 2: Payment & Contact */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                                            <CreditCard size={16} />
                                            Pago y Contacto
                                        </h4>
                                        <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                                            <span className="text-gray-500">Monto:</span>
                                            <span className="font-bold text-gray-900">${invoice.cantidad}</span>

                                            <span className="text-gray-500">Método Pago:</span>
                                            <span className="text-gray-900">{invoice.metodo_pago}</span>

                                            <span className="text-gray-500">Fecha Servicio:</span>
                                            <span className="text-gray-900">{invoice.fecha_servicio || '-'}</span>

                                            <span className="text-gray-500">Email:</span>
                                            <a href={`mailto:${invoice.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                                                {invoice.email}
                                            </a>

                                            <span className="text-gray-500">Teléfono:</span>
                                            <span className="text-gray-900">{invoice.telefono || '-'}</span>
                                        </div>

                                        {invoice.datos_adicionales && (
                                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm mt-2">
                                                <span className="font-semibold text-yellow-800 block mb-1">Notas:</span>
                                                <p className="text-yellow-800">{invoice.datos_adicionales}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end pt-4 border-t border-gray-200">
                                    {invoice.status === 'pending' ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateStatus(invoice.id, 'completed');
                                            }}
                                            disabled={updatingId === invoice.id}
                                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
                                        >
                                            {updatingId === invoice.id ? (
                                                <div className="w-4 h-4 border-2 border-white border-b-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <CheckCircle size={16} />
                                            )}
                                            Marcar como Enviada
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateStatus(invoice.id, 'pending');
                                            }}
                                            className="px-4 py-2 text-gray-500 hover:text-black transition-colors text-sm font-medium"
                                        >
                                            Marcar como Pendiente
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {invoices.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No hay solicitudes</h3>
                        <p className="text-gray-500">Las solicitudes de facturación aparecerán aquí.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
