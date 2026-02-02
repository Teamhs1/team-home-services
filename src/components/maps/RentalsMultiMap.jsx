"use client";

import airbnbMapStyle from "@/components/maps/airbnbMapStyle";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useMemo } from "react";

const DEFAULT_CENTER = { lat: 46.0878, lng: -64.7782 }; // Moncton

export default function RentalsMultiMap({ markers }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  const center = useMemo(() => {
    if (markers.length > 0) {
      return { lat: markers[0].lat, lng: markers[0].lng };
    }
    return DEFAULT_CENTER;
  }, [markers]);

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    );
  }

  return (
    <GoogleMap
      center={center}
      zoom={13}
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
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={{ lat: m.lat, lng: m.lng }}
          zIndex={m.isActive ? 999 : 1}
          label={{
            text: m.label,
            className: `
      px-2 py-1 rounded-full text-xs font-semibold shadow
      transition-all duration-200
      ${
        m.isActive
          ? "bg-primary text-white scale-110"
          : "bg-white text-gray-900"
      }
    `,
          }}
        />
      ))}
    </GoogleMap>
  );
}
