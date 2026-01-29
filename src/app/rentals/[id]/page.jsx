"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import UnitSlider from "@/components/UnitSlider";

export default function RentalDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchUnit() {
      try {
        const res = await fetch(`/api/rentals/${id}`, { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) throw new Error();
        setUnit(json.unit);
      } catch (err) {
        console.error("Failed to load rental:", err);
        setUnit(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUnit();
  }, [id]);

  if (loading) return <div className="p-10">Loading rental…</div>;

  if (!unit) {
    return (
      <div className="p-10 text-center text-gray-500">
        Rental not found or unavailable.
      </div>
    );
  }

  const fullAddress = unit.property?.address
    ? `${unit.property.address}${
        unit.property.postal_code ? `, ${unit.property.postal_code}` : ""
      }`
    : null;
  const sliderImages = (() => {
    if (!unit?.images) return [];

    // ✅ Caso 1: array real
    if (Array.isArray(unit.images)) {
      return unit.images.filter(Boolean);
    }

    // ✅ Caso 2: string tipo "{url1,url2}"
    if (typeof unit.images === "string") {
      return unit.images
        .replace(/[{}"]/g, "")
        .split(",")
        .map((img) => img.trim())
        .filter(Boolean);
    }

    return [];
  })();

  return (
    <div className="w-full bg-white">
      {/* ================= HERO / SLIDER ================= */}
      <div className="relative mt-[72px]">
        <UnitSlider images={sliderImages} height={420} />

        <div className="absolute top-6 left-6 z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </Button>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* INFO BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border rounded-xl p-5 bg-white shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-primary" />
            {fullAddress || "Address not available"}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-primary" />
              Availability:{" "}
              {unit.available_from
                ? new Date(unit.available_from).toLocaleDateString()
                : "Available now"}
            </div>

            <div className="text-3xl font-extrabold text-primary">
              ${unit.rent_price}
              <span className="text-sm font-normal text-gray-500">
                {" "}
                / month
              </span>
            </div>
          </div>
        </div>

        {/* KEY FEATURES */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-primary">
            Key Features
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Feature label={`${unit.bedrooms ?? "—"} Beds`} />
            <Feature label={`${unit.bathrooms ?? "—"} Bath`} />
            <Feature label={`${unit.square_feet ?? "—"} sqft`} />

            <Feature
              label={
                typeof unit.parking === "number" && unit.parking > 0
                  ? `${unit.parking} Parking`
                  : "No Parking"
              }
            />

            {typeof unit.laundry === "boolean" && (
              <Feature label={unit.laundry ? "Laundry" : "No Laundry"} />
            )}

            <Feature label={unit.type || "Apartment"} />

            <Feature
              label={
                unit.property?.year_built
                  ? `Built ${unit.property.year_built}`
                  : "Year N/A"
              }
            />
          </div>
        </section>

        {/* DESCRIPTION */}
        <section>
          <h2 className="text-lg font-semibold mb-3 text-primary">
            What’s Special
          </h2>

          <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700">
            {unit.description || "No description provided."}
          </div>
        </section>

        {/* MAP */}
        <section>
          <h2 className="text-lg font-semibold mb-3 text-primary">
            Find on Map
          </h2>

          {fullAddress ? (
            <iframe
              className="w-full h-[320px] rounded-xl border"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                fullAddress,
              )}&output=embed`}
            />
          ) : (
            <div className="h-[320px] rounded-xl bg-gray-200 flex items-center justify-center text-gray-500">
              Address not available
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ================= SUB COMPONENT ================= */
function Feature({ label }) {
  return (
    <div className="flex items-center justify-center rounded-lg border bg-gray-50 py-4 text-sm font-medium text-gray-700">
      {label}
    </div>
  );
}
