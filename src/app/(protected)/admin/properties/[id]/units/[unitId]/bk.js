"use client";
import PropertyMap from "@/components/PropertyMap";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Slider from "@/components/Slider";
import {
  ArrowLeft,
  Calendar,
  Home,
  Trash2,
  MapPin,
  BedDouble,
  Bath,
  Car,
  Ruler,
  Hammer,
} from "lucide-react";

import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();

  const propertyId = params.id;
  const unitId = params.unitId;

  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [editingPostal, setEditingPostal] = useState(false);
  const [postalDraft, setPostalDraft] = useState("");

  /* =======================
     LOAD UNIT
  ======================= */
  useEffect(() => {
    if (!propertyId || !unitId) return;

    async function loadUnit() {
      try {
        const res = await fetch(
          `/api/admin/properties/${propertyId}/units/${unitId}`,
          {
            cache: "no-store",
            credentials: "include",
          },
        );

        const text = await res.text();
        if (!text) throw new Error("Empty response from server");

        const json = JSON.parse(text);
        if (!res.ok) throw new Error(json.error || "Failed to load unit");

        setUnit(json.unit);
        setPostalDraft(
          json.unit.postal_code ?? json.unit.property?.postal_code ?? "",
        );
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
     DELETE UNIT
  ======================= */
  async function handleDeleteUnit() {
    const confirmed = confirm(
      "⚠️ Delete this unit?\n\nThis action cannot be undone.",
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const res = await fetch(
        `/api/admin/properties/${propertyId}/units/${unitId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to delete unit");
      }

      toast.success("Unit deleted");
      router.push(`/admin/properties/${propertyId}`);
    } catch (err) {
      console.error("❌ Delete unit error:", err);
      toast.error(err.message || "Failed to delete unit");
    } finally {
      setDeleting(false);
    }
  }

  /* =======================
     LOADING SKELETON
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
  const effectiveLat =
    typeof unit.latitude === "number" ? unit.latitude : unit.property?.latitude;

  const effectiveLng =
    typeof unit.longitude === "number"
      ? unit.longitude
      : unit.property?.longitude;

  const isInheritedLocation =
    typeof unit.latitude !== "number" || typeof unit.longitude !== "number";
  const displayedPostal = unit.postal_code ?? unit.property?.postal_code;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 pt-[120px]">
      {/* TOP BAR */}
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
      {/* INFO BAR */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="flex items-center gap-2">
            {unit.property?.address}

            {/* POSTAL CODE */}
            {editingPostal ? (
              <input
                autoFocus
                value={postalDraft}
                onChange={(e) => setPostalDraft(e.target.value)}
                onBlur={async () => {
                  if (postalDraft === unit.postal_code) {
                    setEditingPostal(false);
                    return;
                  }

                  if (!postalDraft.trim()) {
                    toast.error("Postal code cannot be empty");
                    setPostalDraft(unit.property?.postal_code || "");
                    setEditingPostal(false);
                    return;
                  }

                  try {
                    const res = await fetch(
                      `/api/admin/properties/${propertyId}/units/${unitId}`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ postal_code: postalDraft }),
                      },
                    );

                    if (!res.ok) throw new Error();

                    setUnit((prev) => ({
                      ...prev,
                      postal_code: postalDraft,
                    }));

                    toast.success("Postal code updated");
                  } catch {
                    toast.error("Failed to update postal code");
                    setPostalDraft(unit.property?.postal_code || "");
                  } finally {
                    setEditingPostal(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") {
                    setPostalDraft(unit.property?.postal_code || "");
                    setEditingPostal(false);
                  }
                }}
                className="w-24 rounded-md border px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <span
                onClick={() => isAdmin && setEditingPostal(true)}
                className={`group flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition
        ${isAdmin ? "cursor-pointer hover:bg-primary/20" : ""}
      `}
                title={isAdmin ? "Click to edit postal code" : ""}
              >
                {displayedPostal || "—"}

                {isAdmin && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 3.487a2.121 2.121 0 013 3L7.5 18.85l-4 1 1-4L16.862 3.487z"
                    />
                  </svg>
                )}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            {unit.available_from
              ? `Available from ${unit.available_from}`
              : "Availability N/A"}
          </div>

          <div className="text-2xl font-bold text-primary">
            {unit.rent_price ? `$${unit.rent_price}` : "—"}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / month
            </span>
          </div>
        </div>
      </div>

      {/* HEADER CARD */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unit {unit.unit}</h1>

          {unit.type && (
            <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium capitalize text-primary">
              {unit.type}
            </span>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-2">
          <Button
            variant="destructive"
            onClick={handleDeleteUnit}
            disabled={deleting}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete Unit"}
          </Button>
        </div>
      </div>

      {/* KEY FEATURES */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-primary">Key Features</h3>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {/* UNIT TYPE */}
          <EditableKeyFeature
            icon={Home}
            value={unit.type}
            field="type"
            isAdmin={isAdmin}
            unitId={unitId}
            propertyId={propertyId}
            onUpdate={(val) => setUnit((p) => ({ ...p, type: val }))}
          />

          {/* BEDROOMS */}
          <EditableKeyFeature
            icon={BedDouble}
            value={unit.bedrooms}
            field="bedrooms"
            type="number"
            suffix="Bed"
            isAdmin={isAdmin}
            unitId={unitId}
            propertyId={propertyId}
            onUpdate={(val) => setUnit((p) => ({ ...p, bedrooms: val }))}
          />

          {/* BATHROOMS */}
          <EditableKeyFeature
            icon={Bath}
            value={unit.bathrooms}
            field="bathrooms"
            type="number"
            suffix="Bath"
            isAdmin={isAdmin}
            unitId={unitId}
            propertyId={propertyId}
            onUpdate={(val) => setUnit((p) => ({ ...p, bathrooms: val }))}
          />

          {/* PARKING */}
          <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3 text-sm font-medium">
            <Car className="h-5 w-5 text-primary" />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={unit.parking ?? false}
                disabled={!isAdmin}
                onChange={async (e) => {
                  const value = e.target.checked;

                  await fetch(
                    `/api/admin/properties/${propertyId}/units/${unitId}`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({
                        parking: value,
                        parking_spots: value ? (unit.parking_spots ?? 1) : null,
                      }),
                    },
                  );

                  setUnit((p) => ({
                    ...p,
                    parking: value,
                    parking_spots: value ? (p.parking_spots ?? 1) : null,
                  }));

                  toast.success("Parking updated");
                }}
              />
              Parking
            </label>

            {/* 👇 CANTIDAD */}
            {unit.parking && (
              <input
                type="number"
                min={1}
                value={unit.parking_spots ?? ""}
                disabled={!isAdmin}
                onChange={async (e) => {
                  const value = e.target.value ? Number(e.target.value) : null;

                  await fetch(
                    `/api/admin/properties/${propertyId}/units/${unitId}`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ parking_spots: value }),
                    },
                  );

                  setUnit((p) => ({ ...p, parking_spots: value }));
                  toast.success("Parking spots updated");
                }}
                className="ml-2 w-16 rounded-md border px-2 py-0.5 text-sm"
                placeholder="#"
              />
            )}
          </div>

          {/* SQUARE FEET */}
          <EditableKeyFeature
            icon={Ruler}
            value={unit.square_feet}
            field="square_feet"
            type="number"
            suffix="sqft"
            isAdmin={isAdmin}
            unitId={unitId}
            propertyId={propertyId}
            onUpdate={(val) => setUnit((p) => ({ ...p, square_feet: val }))}
          />

          {/* BUILT YEAR (READ ONLY) */}
          <KeyFeature
            icon={Hammer}
            label={`Built ${unit.property?.year_built ?? "—"}`}
          />
        </div>
      </div>

      {/* DESCRIPTION */}
      {unit.description && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-primary">What’s Special</h3>

          <div className="rounded-xl bg-muted/30 p-5 text-sm leading-relaxed">
            {unit.description}
          </div>
        </div>
      )}
      {/* MAP */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Find on Map</h3>
        </div>
        {isInheritedLocation && (
          <p className="text-sm text-muted-foreground">
            Location inherited from property
          </p>
        )}

        <PropertyMap lat={effectiveLat ?? null} lng={effectiveLng ?? null} />
      </div>

      {/* RENTAL SETTINGS */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-lg">Rental Settings</h3>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={unit.is_for_rent}
            onChange={async (e) => {
              const value = e.target.checked;

              await fetch(
                `/api/admin/properties/${propertyId}/units/${unitId}`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ is_for_rent: value }),
                },
              );

              setUnit((prev) => ({ ...prev, is_for_rent: value }));
              toast.success("Rental status updated");
            }}
          />
          List this unit for rent
        </label>

        {unit.is_for_rent && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Monthly Rent
              </label>
              <input
                type="number"
                defaultValue={unit.rent_price ?? ""}
                onBlur={async (e) => {
                  const value = e.target.value;

                  await fetch(
                    `/api/admin/properties/${propertyId}/units/${unitId}`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        rent_price: value ? Number(value) : null,
                      }),
                    },
                  );

                  toast.success("Rent price updated");
                }}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Available From
              </label>
              <input
                type="date"
                defaultValue={unit.available_from ?? ""}
                onBlur={async (e) => {
                  const value = e.target.value;

                  await fetch(
                    `/api/admin/properties/${propertyId}/units/${unitId}`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        rent_price: value ? Number(value) : null,
                      }),
                    },
                  );

                  toast.success("Rent price updated");
                }}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        )}
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
function KeyFeature({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3 text-sm font-medium">
      <Icon className="h-5 w-5 text-primary" />
      <span>{label}</span>
    </div>
  );
}
function EditableKeyFeature({
  icon: Icon,
  value,
  field,
  type = "text",
  suffix = "",
  isAdmin,
  unitId,
  propertyId,
  onUpdate,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  async function save() {
    try {
      const parsed =
        type === "number"
          ? draft === ""
            ? null
            : Number(draft)
          : draft || null;

      const res = await fetch(
        `/api/admin/properties/${propertyId}/units/${unitId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ [field]: parsed }),
        },
      );

      if (!res.ok) throw new Error();

      onUpdate(parsed);
      toast.success("Updated");
    } catch {
      toast.error("Failed to update");
      setDraft(value ?? "");
    } finally {
      setEditing(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3 text-sm font-medium">
      <Icon className="h-5 w-5 text-primary" />

      {editing ? (
        <input
          autoFocus
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setDraft(value ?? "");
              setEditing(false);
            }
          }}
          className="w-20 rounded-md border px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <span
          onClick={() => isAdmin && setEditing(true)}
          className={isAdmin ? "cursor-pointer hover:text-primary" : ""}
        >
          {value ?? "—"} {suffix}
        </span>
      )}
    </div>
  );
}

/* =======================
   PRESENTATIONAL
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
