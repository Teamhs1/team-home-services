"use client";
import React from "react";
import dynamic from "next/dynamic";

// Lazy-load ListingMapView para mejorar rendimiento
const ListingMapView = dynamic(
  () => import("@/app/_components/ListingMapView"),
  {
    ssr: false,
    loading: () => (
      <div className="text-sm text-muted-foreground">Cargando mapa...</div>
    ),
  }
);

function ForRent() {
  return (
    <div className="space-y-10 px-4 py-8 md:px-2 lg:px-4">
      <div className="space-y-2 px-8">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Rent Properties
        </h1>
        <p className="text-muted-foreground">
          Explora el mapa para encontrar propiedades disponibles para alquilar.
        </p>
      </div>

      <div className="min-h-[400px] w-full">
        <ListingMapView type="Rent" />
      </div>
    </div>
  );
}

export default ForRent;
