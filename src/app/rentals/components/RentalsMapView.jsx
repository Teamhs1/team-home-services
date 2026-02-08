"use client";

import { useEffect, useState } from "react";
import RentalsMap from "./RentalsMap";
import RentalCard from "./RentalCard";
import RentalsFilters from "./RentalsFilters";
import { MapPin, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import GoogleMapsProvider from "@/components/GoogleMapsProvider";

export default function RentalsMapView() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [hoveredUnitId, setHoveredUnitId] = useState(null);

  const [filters, setFilters] = useState({
    maxPrice: "",
    beds: "any",
    parking: false,
  });

  useEffect(() => {
    async function loadRentals() {
      try {
        const res = await fetch("/api/rentals", { cache: "no-store" });
        const json = await res.json();
        setUnits(json.units || []);
      } catch (err) {
        console.error("Failed to load rentals", err);
      } finally {
        setLoading(false);
      }
    }
    loadRentals();
  }, []);

  const filteredUnits = units.filter((u) => {
    if (filters.maxPrice && Number(u.rent_price) > Number(filters.maxPrice)) {
      return false;
    }
    if (filters.beds !== "any" && Number(u.bedrooms) < Number(filters.beds)) {
      return false;
    }
    if (filters.parking && (!u.parking_spots || u.parking_spots <= 0)) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-10 text-sm text-muted-foreground">Loading rentals…</div>
    );
  }

  return (
    <>
      {/* FLOATING MAP TOGGLE – DESKTOP */}
      <div
        className={`fixed z-50 hidden items-center transition-all duration-300 ease-in-out lg:flex ${
          showMap
            ? "right-[calc(35.5%+56px)] top-1/2 -translate-y-1/2"
            : "right-10 top-1/2 -translate-y-1/2"
        }`}
      >
        <Button
          onClick={() => setShowMap((prev) => !prev)}
          className="flex h-14 w-14 items-center justify-center rounded-full border bg-white text-gray-600 shadow-md hover:bg-primary hover:text-white"
        >
          {showMap ? (
            <MapPinOff className="h-7 w-7" />
          ) : (
            <MapPin className="h-7 w-7" />
          )}
        </Button>
      </div>

      {/* TOOLTIP – EXACTO COMO 4Rent */}
      <AnimatePresence>
        {showMap && (
          <div
            className="
        hidden lg:block
        fixed right-0 top-24
        h-[calc(100vh-6rem)]
        w-[40%]
        border-l
        bg-white
        z-40
      "
          >
            <div className="relative h-full w-full">
              {/* 🔑 AQUÍ VA EL PROVIDER */}
              <GoogleMapsProvider>
                <RentalsMap
                  units={filteredUnits}
                  hoveredUnitId={hoveredUnitId}
                />
              </GoogleMapsProvider>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div className="relative w-full">
        <div className="space-y-4">
          <RentalsFilters filters={filters} setFilters={setFilters} />

          {/* GRID */}
          <div
            className={`grid gap-4 transition-all duration-300 ${
              showMap ? "pr-[calc(40%+16px)]" : "pr-0"
            }`}
            style={{
              gridTemplateColumns: showMap
                ? "repeat(auto-fit, minmax(320px, 1fr))"
                : "repeat(auto-fit, minmax(260px, 1fr))",
              justifyContent: "start",
            }}
          >
            {filteredUnits.map((unit) => (
              <RentalCard
                key={unit.id}
                unit={unit}
                onHover={() => setHoveredUnitId(unit.id)}
                onLeave={() => setHoveredUnitId(null)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE MAP TOGGLE */}
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 lg:hidden">
        <Button
          onClick={() => setShowMap((prev) => !prev)}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-white shadow-lg"
        >
          {showMap ? (
            <>
              <MapPinOff className="h-4 w-4" />
              Hide map
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" />
              Show map
            </>
          )}
        </Button>
      </div>
    </>
  );
}
