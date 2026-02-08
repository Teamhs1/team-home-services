"use client";

import { useMemo } from "react";
import RentalsMultiMap from "@/components/maps/RentalsMultiMap";

export default function RentalsMap({ units, hoveredUnitId }) {
  const markers = useMemo(() => {
    return units
      .map((u) => {
        if (!u.property?.lat || !u.property?.lng) return null;

        const address = [
          u.property.address, // "45 Cameron"
          u.unit ? `Unit ${u.unit}` : "", // "Unit C"
        ]
          .filter(Boolean)
          .join(" · ");

        return {
          id: u.id,
          lat: Number(u.property.lat),
          lng: Number(u.property.lng),

          // 👇 NUEVO (clave)
          address, // "45 Cameron · Unit C"
          price: u.rent_price, // 975

          // estado activo
          isActive: hoveredUnitId === u.id,
        };
      })
      .filter(Boolean);
  }, [units, hoveredUnitId]);

  return (
    <div className="h-full w-full">
      <RentalsMultiMap markers={markers} />
    </div>
  );
}
