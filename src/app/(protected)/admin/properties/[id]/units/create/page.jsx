"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const SCHEMES = [
  { value: "numbers", label: "1, 2, 3, 4…" },
  { value: "letters", label: "A, B, C…" },
  { value: "hundreds", label: "101, 102, 103…" },
];

export default function CreateUnitPage() {
  const router = useRouter();
  const { id: propertyId } = useParams();

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [existingUnits, setExistingUnits] = useState([]);

  const [mode, setMode] = useState("single"); // single | bulk

  const [form, setForm] = useState({
    unit: "",
    type: "",
    count: 1,
    scheme: "numbers",
  });

  /* =====================
     LOAD PROPERTY + UNITS
  ===================== */
  useEffect(() => {
    if (!propertyId) return;

    async function loadData() {
      try {
        const res = await fetch(`/api/admin/properties/${propertyId}`, {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load property");

        const data = await res.json();

        setProperty(data.property || null);

        // ✅ USAR LAS UNITS QUE YA VIENEN
        setExistingUnits(data.units || []);
      } catch (err) {
        toast.error("Failed to load property");
        router.push("/admin/properties");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [propertyId, router]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  /* =====================
     BUILD UNITS (PREVIEW)
  ===================== */
  const unitsPreview = useMemo(() => {
    if (mode === "single") {
      return form.unit ? [form.unit] : [];
    }

    const count = Number(form.count) || 0;
    if (count <= 0) return [];

    if (form.scheme === "numbers") {
      return Array.from({ length: count }, (_, i) => String(i + 1));
    }

    if (form.scheme === "letters") {
      return Array.from({ length: count }, (_, i) =>
        String.fromCharCode(65 + i)
      );
    }

    if (form.scheme === "hundreds") {
      return Array.from({ length: count }, (_, i) => String(101 + i));
    }

    return [];
  }, [mode, form]);

  /* =====================
     DUPLICATES
  ===================== */
  const existingSet = useMemo(
    () => new Set(existingUnits.map((u) => String(u.unit))),
    [existingUnits]
  );

  const duplicates = unitsPreview.filter((u) => existingSet.has(String(u)));
  const finalUnits = unitsPreview.filter((u) => !existingSet.has(String(u)));

  /* =====================
     SUBMIT
  ===================== */
  async function handleSubmit(e) {
    e.preventDefault();

    if (finalUnits.length === 0) {
      toast.error("All units already exist");
      return;
    }

    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/units`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          units: finalUnits,
          type: form.type || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to create units");
      }

      toast.success(`${finalUnits.length} unit(s) created`);
      router.push(`/admin/properties/${propertyId}`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create units");
    }
  }

  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">Loading…</div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-6 pt-[130px] space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Add Units</h1>
        <p className="text-sm text-gray-500">
          {property?.name || property?.address}
        </p>
      </div>

      {/* MODE */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "single" ? "default" : "outline"}
          onClick={() => setMode("single")}
        >
          Single
        </Button>
        <Button
          type="button"
          variant={mode === "bulk" ? "default" : "outline"}
          onClick={() => setMode("bulk")}
        >
          Bulk
        </Button>
      </div>

      {/* EXISTING UNITS */}
      {existingUnits.length > 0 && (
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Existing units
          </p>
          <div className="flex flex-wrap gap-2">
            {existingUnits.map((u) => (
              <span
                key={u.id}
                className="rounded-md border bg-background px-2 py-1 text-xs"
              >
                {u.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "single" && (
          <input
            name="unit"
            placeholder="Unit number (e.g. 101)"
            required
            className="w-full border rounded p-2"
            value={form.unit}
            onChange={handleChange}
          />
        )}

        {mode === "bulk" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <input
                name="count"
                type="number"
                min="1"
                placeholder="How many units"
                className="border rounded p-2"
                value={form.count}
                onChange={handleChange}
              />

              <select
                name="scheme"
                className="border rounded p-2"
                value={form.scheme}
                onChange={handleChange}
              >
                {SCHEMES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* PREVIEW */}
            <div className="rounded border bg-muted p-3 text-sm">
              <p className="font-medium mb-2">Preview</p>
              <div className="flex flex-wrap gap-2">
                {unitsPreview.map((u) => {
                  const isDuplicate = existingSet.has(String(u));
                  return (
                    <span
                      key={u}
                      className={`rounded px-2 py-1 border text-xs ${
                        isDuplicate
                          ? "bg-red-100 border-red-400 text-red-700"
                          : "bg-background"
                      }`}
                    >
                      {u}
                    </span>
                  );
                })}
              </div>

              {duplicates.length > 0 && (
                <p className="mt-2 text-xs text-red-600">
                  ⚠️ {duplicates.length} unit(s) already exist and will be
                  skipped
                </p>
              )}
            </div>
          </>
        )}

        <input
          name="type"
          placeholder="Type (optional)"
          className="w-full border rounded p-2"
          value={form.type}
          onChange={handleChange}
        />

        <Button className="w-full" type="submit">
          Create {finalUnits.length} Unit(s)
        </Button>
      </form>
    </div>
  );
}
