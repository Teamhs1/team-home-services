"use client";

import PropertyMap from "@/components/PropertyMap";
import Slider from "@/components/Slider";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  ArrowLeft,
  Calendar,
  MapPin,
  Home,
  BedDouble,
  Bath,
  Car,
  Ruler,
  Hammer,
} from "lucide-react";

export default function UnitDetailPublicPage() {
  const { id: propertyId, unitId } = useParams();
  const router = useRouter();

  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingLocation, setSavingLocation] = useState(false);

  /* =======================
     LOAD UNIT
  ======================= */

  useEffect(() => {
    if (!propertyId || !unitId) return;

    async function loadUnit() {
      try {
        const res = await fetch(
          `/api/dashboard/properties/${propertyId}/units/${unitId}`,
          { cache: "no-store", credentials: "include" },
        );

        if (!res.ok) throw new Error("Failed to load unit");

        const json = await res.json();
        setUnit(json.unit);
      } catch (err) {
        toast.error(err.message);
        router.back();
      } finally {
        setLoading(false);
      }
    }

    loadUnit();
  }, [propertyId, unitId, router]);

  /* =======================
     LOADING
  ======================= */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6 pt-[120px]">
        <div className="h-[420px] w-full animate-pulse rounded-2xl bg-muted" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!unit) return null;

  /* =======================
     LOCATION
  ======================= */

  const lat =
    typeof unit.latitude === "number"
      ? unit.latitude
      : (unit.property?.latitude ?? null);

  const lng =
    typeof unit.longitude === "number"
      ? unit.longitude
      : (unit.property?.longitude ?? null);

  /* =======================
     IMAGES
  ======================= */

  const sliderImages = (
    unit.images?.length ? unit.images : unit.property?.images || []
  ).map((img) => (typeof img === "string" ? { url: img } : img));

  /* =======================
     UPDATE LOCATION
  ======================= */

  async function handleLocationChange({ lat, lng }) {
    if (!propertyId || !unitId) return;

    try {
      setSavingLocation(true);

      const res = await fetch(
        `/api/dashboard/properties/${propertyId}/units/${unitId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
          }),
        },
      );

      if (!res.ok) throw new Error("Failed to update location");

      setUnit((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));

      toast.success("Location updated");
    } catch {
      toast.error("Failed to update location");
    } finally {
      setSavingLocation(false);
    }
  }

  const displayedPostal =
    unit.postal_code ?? unit.property?.postal_code ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 pt-[120px]">
      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* SLIDER */}
      <div className="overflow-hidden rounded-2xl border shadow-sm">
        <Slider images={sliderImages} />
      </div>

      {/* ADDRESS */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 text-primary" />

        <span className="flex items-center gap-2">
          {unit.property?.address}

          {displayedPostal && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {displayedPostal}
            </span>
          )}
        </span>
      </div>

      {/* TITLE */}
      <div>
        <h1 className="text-3xl font-bold">Unit {unit.unit}</h1>

        {unit.type && (
          <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium capitalize text-primary">
            {unit.type}
          </span>
        )}
      </div>

      {/* PRICE */}
      {unit.rent_price && (
        <div className="text-2xl font-bold text-primary">
          ${Number(unit.rent_price).toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / month
          </span>
        </div>
      )}

      {/* AVAILABILITY */}
      {unit.available_from && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          Available from {new Date(unit.available_from).toLocaleDateString()}
        </div>
      )}

      {/* FEATURES */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Feature icon={BedDouble} label={`${unit.bedrooms ?? "—"} Beds`} />
        <Feature icon={Bath} label={`${unit.bathrooms ?? "—"} Baths`} />

        <Feature
          icon={Car}
          label={
            unit.parking ? `Parking (${unit.parking_spots ?? 1})` : "No parking"
          }
        />

        <Feature
          icon={Ruler}
          label={
            unit.square_feet ? `${unit.square_feet} sqft` : "Size not specified"
          }
        />

        <Feature
          icon={Hammer}
          label={`Built ${unit.property?.year_built ?? "—"}`}
        />
      </div>

      {/* DESCRIPTION */}
      {unit.description && (
        <div className="bg-gray-50 rounded-xl p-6 text-sm text-gray-700">
          <div className="columns-1 md:columns-2 gap-10">
            {unit.description
              .split("\n")
              .filter(Boolean)
              .map((line, i) => {
                const lower = line.toLowerCase();

                const isRestricted =
                  lower.includes("no ") ||
                  lower.includes("not allowed") ||
                  lower.includes("required");

                return (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg">
                      {isRestricted ? "❌" : "✅"}
                    </span>
                    <span>{line}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MAP */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Location</h3>

          {savingLocation && (
            <span className="text-sm text-muted-foreground">
              Saving location…
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Drag the pin to adjust the exact unit location.
        </p>

        <PropertyMap
          lat={lat}
          lng={lng}
          editable
          onChange={handleLocationChange}
        />
      </div>

      {/* INFO */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard
          icon={<Home className="h-5 w-5 text-primary" />}
          label="Property"
          value={unit.property?.address || "—"}
        />

        <InfoCard
          icon={<Calendar className="h-5 w-5 text-primary" />}
          label="Available From"
          value={
            unit.available_from
              ? new Date(unit.available_from).toLocaleDateString()
              : "N/A"
          }
        />
      </div>
    </div>
  );
}

/* =======================
   SMALL COMPONENTS
======================= */

function Feature({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3 text-sm font-medium">
      <Icon className="h-5 w-5 text-primary" />
      <span>{label}</span>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border bg-card p-5">
      {icon}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
