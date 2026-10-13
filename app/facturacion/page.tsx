"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle, AlertCircle, MessageCircle } from "lucide-react";

export default function FacturacionPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        razon_social: "",
        rfc: "",
        calle: "",
        colonia: "",
        municipio: "",
        estado: "",
        codigo_postal: "",
        telefono: "",
        email: "",
        regimen_fiscal: "",
        cantidad: "",
        metodo_pago: "",
        uso_cfdi: "",
        fecha_servicio: "",
        datos_adicionales: ""
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (["telefono", "codigo_postal"].includes(name)) {
            if (value && !/^\d*$/.test(value)) return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Basic validation
        if (!formData.razon_social || !formData.rfc || !formData.email) {
            setError("Por favor completa los campos obligatorios (*)");
            setIsSubmitting(false);
            return;
        }

        try {
            const { error: supabaseError } = await supabase
                .from('facturacion')
                .insert([formData]);

            if (supabaseError) throw supabaseError;

            setSuccess(true);
            setFormData({
                razon_social: "",
                rfc: "",
                calle: "",
                colonia: "",
                municipio: "",
                estado: "",
                codigo_postal: "",
                telefono: "",
                email: "",
                regimen_fiscal: "",
                cantidad: "",
                metodo_pago: "",
                uso_cfdi: "",
                fecha_servicio: "",
                datos_adicionales: ""
            });
        } catch (err: any) {
            console.error("Error submitting invoice request:", err);
            setError("Hubo un error al enviar tu solicitud. Por favor intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="bg-white min-h-screen flex flex-col">
            <Header />
            <div className="h-24"></div> {/* Spacer for fixed header */}

            <section className="flex-grow container mx-auto px-4 py-12 max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Solicitud de Facturación</h1>
                    <p className="text-gray-600 mb-6">
                        Puede solicitar su factura rellenando este formulario; una vez enviado, uno de nuestros agentes le enviará la factura correspondiente por correo electrónico.
                        También, si lo prefiere, puede solicitarla vía WhatsApp y uno de nuestros agentes le pedirá sus datos para emitir la factura.
                    </p>

                    <a
                        href="https://wa.me/528181818181" // Replace with actual number
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#1e2e4a] text-white px-6 py-3 rounded-md hover:bg-[#152033] transition-colors font-medium mb-8"
                    >
                        <MessageCircle size={20} />
                        Solicitar factura por WhatsApp
                    </a>
                </div>

                {success ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center animate-in fade-in zoom-in duration-300">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-green-800 mb-2">¡Solicitud Enviada!</h2>
                        <p className="text-green-600">
                            Hemos recibido tus datos correctamente. En breve recibirás tu factura en el correo proporcionado.
                        </p>
                        <button
                            onClick={() => setSuccess(false)}
                            className="mt-6 text-green-700 font-semibold hover:underline"
                        >
                            Enviar otra solicitud
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Row 1 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Nombre / Razón social *</label>
                                <input
                                    type="text"
                                    name="razon_social"
                                    value={formData.razon_social}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">RFC *</label>
                                <input
                                    type="text"
                                    name="rfc"
                                    value={formData.rfc}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Row 2 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Calle</label>
                                <input
                                    type="text"
                                    name="calle"
                                    value={formData.calle}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Colonia</label>
                                <input
                                    type="text"
                                    name="colonia"
                                    value={formData.colonia}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            {/* Row 3 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Municipio</label>
                                <input
                                    type="text"
                                    name="municipio"
                                    value={formData.municipio}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Estado</label>
                                <input
                                    type="text"
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            {/* Row 4 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Código postal</label>
                                <input
                                    type="text"
                                    name="codigo_postal"
                                    value={formData.codigo_postal}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Teléfono o celular</label>
                                <input
                                    type="tel"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            {/* Row 5 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Régimen</label>
                                <input
                                    type="text"
                                    name="regimen_fiscal"
                                    value={formData.regimen_fiscal}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            {/* Row 6 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Cantidad</label>
                                <input
                                    type="text"
                                    name="cantidad"
                                    value={formData.cantidad}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Método de pago</label>
                                <select
                                    name="metodo_pago"
                                    value={formData.metodo_pago}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                                >
                                    <option value="">Seleccione una opción</option>
                                    <option value="PUE">Pago en una sola exhibición (PUE)</option>
                                    <option value="PPD">Pago en parcialidades o diferido (PPD)</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Transferencia">Transferencia electrónica</option>
                                    <option value="Tarjeta">Tarjeta de crédito/débito</option>
                                </select>
                            </div>

                            {/* Row 7 */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Uso de CFDI</label>
                                <input
                                    type="text"
                                    name="uso_cfdi"
                                    value={formData.uso_cfdi}
                                    onChange={handleInputChange}
                                    placeholder="Ej. G03 - Gastos en general"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Fecha del servicio solicitado</label>
                                <input
                                    type="date"
                                    name="fecha_servicio"
                                    value={formData.fecha_servicio}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            {/* Full Width Row */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Datos adicionales</label>
                                <textarea
                                    name="datos_adicionales"
                                    value={formData.datos_adicionales}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#a87b05] text-white font-bold py-4 rounded-md hover:bg-[#8a6504] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                                {isSubmitting ? "Enviando..." : "Solicitar factura"}
                            </button>
                        </div>
                    </form>
                )}
            </section>

            <Footer />
        </main>
    );
}
