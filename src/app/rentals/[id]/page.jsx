"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RentalDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchUnit() {
      try {
        const res = await fetch(`/api/rentals/${id}`);
        const json = await res.json();

        if (!res.ok) throw new Error();

        setUnit(json.unit);
      } catch {
        router.push("/rentals");
      } finally {
        setLoading(false);
      }
    }

    fetchUnit();
  }, [id, router]);

  if (loading) return <div className="p-10">Loading rental…</div>;
  if (!unit) return null;

  return (
    <div className="w-full bg-white">
      {/* ================= HERO IMAGE ================= */}
      <div className="relative h-[420px] w-full bg-gray-200">
        <img
          src={unit.cover_image || "/placeholder.jpg"}
          alt="Rental"
          className="w-full h-full object-cover"
        />

        <div className="absolute top-6 left-6">
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
            {unit.property.address}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-primary" />
              Availability: {unit.available_from || "N/A"}
            </div>

            <div className="text-2xl font-bold text-primary">
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
            <Feature label={`${unit.bedrooms || "—"} Beds`} />
            <Feature label={`${unit.bathrooms || "—"} Bath`} />
            <Feature label="Parking" />
            <Feature label="Laundry" />
            <Feature label={unit.property?.type || "Residential"} />
            <Feature label={`${unit.square_feet || "—"} sqft`} />
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

        {/* MAP (placeholder por ahora) */}
        <section>
          <h2 className="text-lg font-semibold mb-3 text-primary">
            Find on Map
          </h2>

          <div className="h-[320px] rounded-xl bg-gray-200 flex items-center justify-center text-gray-500">
            Map goes here
          </div>
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
