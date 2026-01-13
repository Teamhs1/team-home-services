"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  useJsApiLoader,
} from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DEFAULT_CENTER = { lat: 46.0878, lng: -64.7782 }; // Moncton
const LIBRARIES = ["places"];

/* =====================
   HELPERS
===================== */
function extractPostalCode(addressComponents = []) {
  const comp = addressComponents.find((c) => c.types.includes("postal_code"));

  return comp?.long_name
    ? comp.long_name.replace(/\s+/g, "").toUpperCase()
    : null;
}

export default function SetLocationPage() {
  const { id } = useParams();
  const router = useRouter();

  const [property, setProperty] = useState(null);
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState(null);
  const [saving, setSaving] = useState(false);

  const autocompleteRef = useRef(null);

  /* =====================
     Load Maps + Places
  ===================== */
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  /* =====================
     Reverse Geocode
  ===================== */
  function reverseGeocode(lat, lng) {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== "OK" || !results?.[0]) return;

      setAddress(results[0].formatted_address || "");
      setPostalCode(extractPostalCode(results[0].address_components));
    });
  }

  /* =====================
     Load property
  ===================== */
  useEffect(() => {
    async function loadProperty() {
      const res = await fetch(`/api/admin/properties/${id}`, {
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json();
      setProperty(json.property);

      if (json.property?.latitude && json.property?.longitude) {
        const lat = json.property.latitude;
        const lng = json.property.longitude;

        setPosition({ lat, lng });
      }

      if (json.property?.address) {
        setAddress(json.property.address);
      }

      if (json.property?.postal_code) {
        setPostalCode(json.property.postal_code);
      }
    }

    loadProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* =====================
     Autocomplete select
  ===================== */
  function onPlaceChanged() {
    const place = autocompleteRef.current?.getPlace();

    if (!place?.geometry) {
      toast.error("Please select an address from the list");
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    setPosition({ lat, lng });
    setAddress(place.formatted_address || "");
    setPostalCode(extractPostalCode(place.address_components));
  }

  /* =====================
     Save location
  ===================== */
  async function saveLocation() {
    if (!position) {
      toast.error("Please select a location");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          latitude: position.lat,
          longitude: position.lng,
          postal_code: postalCode ?? null,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Location saved");
      router.refresh();
      router.back();
    } catch {
      toast.error("Failed to save location");
    } finally {
      setSaving(false);
    }
  }

  if (!isLoaded || !property) {
    return (
      <div className="p-6 pt-[120px] text-muted-foreground">Loading map…</div>
    );
  }

  return (
    <div className="p-6 pt-[120px] max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Set property location</h1>

      {/* 🔍 ADDRESS SEARCH */}
      <Autocomplete
        onLoad={(ref) => (autocompleteRef.current = ref)}
        onPlaceChanged={onPlaceChanged}
        fields={["geometry", "formatted_address", "address_components"]}
        options={{
          types: ["geocode"],
          componentRestrictions: { country: "ca" },
        }}
      >
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Search address (ex: 5 Bristol Cres, Moncton)"
          className="w-full border rounded-lg px-4 py-3 text-sm"
        />
      </Autocomplete>

      {/* 🧾 POSTAL CODE */}
      <div className="text-sm text-muted-foreground">
        Postal Code:{" "}
        <span className="font-medium text-foreground">{postalCode || "—"}</span>
      </div>

      {/* 🗺 MAP */}
      <div className="h-[420px] rounded-xl overflow-hidden border">
        <GoogleMap
          center={position || DEFAULT_CENTER}
          zoom={16}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          onClick={(e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();

            setPosition({ lat, lng });
            reverseGeocode(lat, lng);
          }}
        >
          {position && (
            <Marker
              position={position}
              draggable
              onDragEnd={(e) => {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();

                setPosition({ lat, lng });
                reverseGeocode(lat, lng);
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>

        <Button onClick={saveLocation} disabled={!position || saving}>
          {saving ? "Saving..." : "Save location"}
        </Button>
      </div>
    </div>
  );
}
