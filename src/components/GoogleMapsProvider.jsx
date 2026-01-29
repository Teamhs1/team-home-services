"use client";

import { useJsApiLoader } from "@react-google-maps/api";

const libraries = ["places"];

export default function GoogleMapsProvider({ children }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  if (!isLoaded) return null;

  return children;
}
