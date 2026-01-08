"use client";

import { MapPin } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const libraries = ["places"];

function GoogleAddressSearch({ onChange, defaultValue = "", className = "" }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [ready, setReady] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY,
    libraries,
  });

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google?.maps?.places) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["geocode"],
        fields: ["formatted_address", "geometry"],
      }
    );

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      if (!place || !place.geometry) return;

      const coords = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      const label = place.formatted_address;

      inputRef.current.value = label;

      onChange?.({ label }, coords); // ✅ Aquí se actualiza correctamente
    });

    setReady(true);
  }, [isLoaded]);

  return (
    <div className={`relative flex w-full items-center ${className}`}>
      <MapPin className="h-10 w-10 rounded-l-lg bg-purple-200 p-2 text-primary" />
      <input
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        placeholder={ready ? "Search Property Address" : "Loading..."}
        className="w-full rounded-r-lg border p-2 outline-none disabled:bg-gray-100 disabled:text-gray-400"
        disabled={!ready}
      />
    </div>
  );
}

export default GoogleAddressSearch;
