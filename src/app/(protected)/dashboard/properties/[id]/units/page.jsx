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

  /* =======================
     LOAD UNIT (NON ADMIN)
  ======================= */
  useEffect(() => {
    if (!propertyId || !unitId) return;

    async function loadUnit() {
      try {
        const res = await fetch(
          `/api/dashboard/properties/${propertyId}/units/${unitId}`,
          { cache: "no-store", credentials: "include" }
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

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6 pt-[120px]">Loading unit…</div>
    );
  }

  if (!unit) return null;

  const lat =
    typeof unit.latitude === "number" ? unit.latitude : unit.property?.latitude;

  const lng =
    typeof unit.longitude === "number"
      ? unit.longitude
      : unit.property?.longitude;

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

      {/* IMAGES */}
      <div className="overflow-hidden rounded-2xl border">
        <Slider images={unit.property?.images || []} />
      </div>

      {/* ADDRESS */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        {unit.property?.address}
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
          ${unit.rent_price}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / month
          </span>
        </div>
      )}

      {/* FEATURES */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Feature icon={BedDouble} label={`${unit.bedrooms ?? "—"} Beds`} />
        <Feature icon={Bath} label={`${unit.bathrooms ?? "—"} Baths`} />
        <Feature
          icon={Car}
          label={unit.parking ? "Parking available" : "No parking"}
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
        <div className="rounded-xl bg-muted/30 p-5 text-sm">
          {unit.description}
        </div>
      )}

      {/* MAP */}
      <PropertyMap lat={lat ?? null} lng={lng ?? null} />

      {/* INFO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
