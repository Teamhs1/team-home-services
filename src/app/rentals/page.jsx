"use client";
import dynamic from "next/dynamic";

const RentalsMapView = dynamic(() => import("./components/RentalsMapView"), {
  ssr: false,
});

export default function RentalsPage() {
  return (
    <div className="space-y-10 px-4 py-8 md:px-2 lg:px-4">
      <div className="space-y-2 px-8">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Rent Properties
        </h1>
        <p className="text-muted-foreground">
          Explore rentals using the map and filters.
        </p>
      </div>

      <RentalsMapView />
    </div>
  );
}
