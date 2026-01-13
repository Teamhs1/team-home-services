"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
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

        if (!res.ok) {
          throw new Error(json.error || "Failed to load rental");
        }

        // 🔑 API devuelve { unit: {...} }
        setUnit(json.unit);
      } catch (err) {
        console.error(err);
        router.push("/rentals");
      } finally {
        setLoading(false);
      }
    }

    fetchUnit();
  }, [id, router]);

  if (loading) {
    return <div className="p-10">Loading rental…</div>;
  }

  if (!unit) {
    return <div className="p-10">Rental not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-10 space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to rentals
      </Button>

      <div className="rounded-2xl border p-6 bg-white shadow-sm space-y-4">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {unit.property.address}
        </p>

        <h1 className="text-3xl font-bold">Unit {unit.unit}</h1>

        <p className="text-xl font-semibold">${unit.rent_price} / month</p>

        <p className="text-sm text-green-600 capitalize">
          {unit.availability_status}
        </p>
      </div>
    </div>
  );
}
