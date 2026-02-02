"use client";

import { useMemo } from "react";
import RentalsMultiMap from "@/components/maps/RentalsMultiMap";

export default function RentalsMap({ units, hoveredUnitId }) {
  const markers = useMemo(() => {
    return units
      .map((u) => {
        if (!u.property?.lat || !u.property?.lng) return null;

        return {
          id: u.id,
          lat: Number(u.property.lat),
          lng: Number(u.property.lng),
          label: `$${u.rent_price}`,
          isActive: hoveredUnitId === u.id,
        };
      })
      .filter(Boolean);
  }, [units, hoveredUnitId]); // 🔥 ESTO FALTABA

  return (
    <div className="h-full w-full">
      <RentalsMultiMap markers={markers} />
    </div>
  );
}
