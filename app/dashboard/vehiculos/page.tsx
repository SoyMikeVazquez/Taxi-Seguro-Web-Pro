"use client";

import VehicleManager from "@/components/VehicleManager";

export default function VehiclesPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-xl font-medium text-gray-800 tracking-wider">GESTIÓN DE VEHÍCULOS</h1>
            <VehicleManager />
        </div>
    );
}
