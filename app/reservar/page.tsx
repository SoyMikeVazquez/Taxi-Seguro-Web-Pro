import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";

export default function Reservar() {
    return (
        <main className="bg-gray-50 min-h-screen flex flex-col">
            <Header />

            {/* Spacer for fixed header */}
            <div className="h-24"></div>

            <section className="flex-grow container mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">Pide tu Taxi Seguro</h1>
                    <p className="text-gray-600">Ingresa tu punto de partida y destino para cotizar y solicitar tu viaje al instante.</p>
                </div>

                <Suspense fallback={<div className="text-center py-10">Cargando formulario...</div>}>
                    <BookingForm />
                </Suspense>
            </section>

            <Footer />
        </main>
    );
}
