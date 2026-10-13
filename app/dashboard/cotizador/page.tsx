import DistanceCalculator from "@/components/DistanceCalculator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cotizador de Ruta | Taxiseguro - Transporte Premium",
  description: "Calcula el costo y la distancia de tu próximo traslado ejecutivo con nuestra herramienta inteligente de Mapbox.",
};

export default function CotizadorPage() {
  return (
    <main className="min-h-screen">
      <DistanceCalculator />
    </main>
  );
}
