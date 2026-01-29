"use client";

import airbnbMapStyle from "@/components/maps/airbnbMapStyle";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useState, useEffect } from "react";

export default function PropertyMap({
  lat,
  lng,
  onChange, // 🔥 callback para devolver la posición
}) {
  const hasInitialPosition = typeof lat === "number" && typeof lng === "number";

  const [position, setPosition] = useState(
    hasInitialPosition ? { lat, lng } : null,
  );

  /* =====================
     Sync external changes
  ===================== */
  useEffect(() => {
    if (hasInitialPosition) {
      setPosition({ lat, lng });
    }
  }, [lat, lng, hasInitialPosition]);

  /* =====================
     Empty state
  ===================== */
  if (!position) {
    return (
      <div className="h-[320px] rounded-xl border bg-muted flex items-center justify-center text-sm text-muted-foreground">
        Click on the map to set location
      </div>
    );
  }

  return (
    <div className="h-[320px] rounded-xl overflow-hidden border">
      <GoogleMap
        center={position}
        zoom={15}
        mapContainerStyle={{ width: "100%", height: "100%" }}
        options={{
          styles: airbnbMapStyle,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
        }}
        onClick={(e) => {
          const newPos = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          };

          setPosition(newPos);
          onChange?.(newPos);
        }}
      >
        <Marker
          position={position}
          draggable
          onDragEnd={(e) => {
            const newPos = {
              lat: e.latLng.lat(),
              lng: e.latLng.lng(),
            };

            setPosition(newPos);
            onChange?.(newPos);
          }}
        />
      </GoogleMap>
    </div>
  );
}
