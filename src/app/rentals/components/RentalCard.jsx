"use client";

import Link from "next/link";
import MiniImageSlider from "@/components/MiniImageSlider";
import { BedDouble, Bath, Car } from "lucide-react";

export default function RentalCard({ unit, onHover, onLeave }) {
  const images = Array.isArray(unit.images)
    ? unit.images
    : typeof unit.images === "string"
      ? unit.images.replace(/[{}"]/g, "").split(",")
      : [];

  return (
    <a
      href={`/rentals/${unit.id}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="
        group
        block
        rounded-2xl
        overflow-hidden
        bg-white
        shadow-sm
        hover:shadow-lg
        transition-all
        duration-300
        hover:-translate-y-0.5
      "
    >
      {/* IMAGE */}
      <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
        <MiniImageSlider images={images} />
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-2">
        <p className="text-xs text-gray-500 truncate">
          📍 {unit.property?.address}
        </p>

        <h3 className="text-sm font-semibold leading-tight truncate">
          Unit {unit.unit}
        </h3>

        <p className="text-base font-semibold text-primary">
          ${unit.rent_price}
          <span className="text-xs text-gray-500 font-normal"> / mo</span>
        </p>

        <div className="flex gap-2 text-[11px] text-gray-500">
          <span>
            {unit.bedrooms === 0 ? "Bachelor" : `${unit.bedrooms} bd`}
          </span>
          <span>· {unit.bathrooms} ba</span>
          {unit.parking_spots > 0 && <span>· Parking</span>}
        </div>
      </div>
    </a>
  );
}
