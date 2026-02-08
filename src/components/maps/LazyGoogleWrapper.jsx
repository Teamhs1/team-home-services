"use client";

import { LoadScript } from "@react-google-maps/api";

const libraries = ["places"];

export default function LazyGoogleWrapper({ children }) {
  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
      loadingElement={
        <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
          Loading map…
        </div>
      }
    >
      {children}
    </LoadScript>
  );
}
