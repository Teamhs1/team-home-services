"use client";

import { OverlayView } from "@react-google-maps/api";

export default function PriceAddressMarker({
  position,
  address,
  price,
  label,
  title,
  isActive,
  onClick,
}) {
  const displayAddress = address || title || "";
  const displayPrice = price != null ? `$${price}` : label || "";

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        onClick={onClick}
        className={`
          -translate-x-1/2 -translate-y-full
          cursor-pointer select-none
          rounded-2xl
          px-4 py-2
          border border-gray-200
          shadow-lg
          transition-all duration-200
          ${
            isActive
              ? "bg-blue-600 scale-110 shadow-xl z-50 ring-2 ring-blue-600/40"
              : "bg-white hover:scale-105"
          }
        `}
        style={{ minWidth: 110 }}
      >
        {/* Dirección */}
        {displayAddress && (
          <div
            className={`
              text-[11px]
              leading-snug
              text-center
              max-w-[160px]
              line-clamp-2
              mb-0.5
              ${isActive ? "text-white/90" : "text-gray-500"}
            `}
            title={displayAddress}
          >
            {displayAddress}
          </div>
        )}

        {/* Precio */}
        <div
          className={`text-base font-bold text-center ${
            isActive ? "text-white" : "text-gray-900"
          }`}
        >
          {displayPrice}
        </div>
      </div>
    </OverlayView>
  );
}
