"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Slider from "@/components/Slider";
import { ArrowLeft, Calendar, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();

  const propertyId = params.id;
  const unitId = params.unitId;

  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId || !unitId) return;

    async function loadUnit() {
      try {
        const res = await fetch(
          `/api/admin/properties/${propertyId}/units/${unitId}`,
          { cache: "no-store" }
        );

        const text = await res.text();
        if (!text) throw new Error("Empty response from server");

        const json = JSON.parse(text);
        if (!res.ok) throw new Error(json.error || "Failed to load unit");

        setUnit(json.unit);
      } catch (err) {
        toast.error(err.message);
        router.push(`/admin/properties/${propertyId}`);
      } finally {
        setLoading(false);
      }
    }

    loadUnit();
  }, [propertyId, unitId, router]);

  /* =======================
     SKELETON (PRO FEEL)
  ======================= */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6 pt-[120px]">
        <div className="h-[420px] w-full animate-pulse rounded-2xl bg-muted" />
        <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!unit) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 pt-[120px]">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to property
        </Button>
      </div>

      {/* HERO / SLIDER */}
      <div className="overflow-hidden rounded-2xl border shadow-sm">
        <Slider images={unit.property?.images || []} />
      </div>

      {/* HEADER CARD */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unit {unit.unit}</h1>
          {unit.type && (
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium capitalize text-primary">
              {unit.type}
            </span>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {unit.property?.address}
        </div>
      </div>

      {/* INFO GRID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard
          icon={<Home className="h-5 w-5 text-primary" />}
          label="Property"
          value={unit.property?.address || "—"}
        />
        <InfoCard
          icon={<Calendar className="h-5 w-5 text-primary" />}
          label="Created"
          value={new Date(unit.created_at).toLocaleDateString()}
        />
      </div>
    </div>
  );
}

/* =======================
   SMALL COMPONENTS
======================= */

function InfoCard({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-sm">
      {icon}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
