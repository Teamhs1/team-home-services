"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

export default function CreateUnitPage() {
  const router = useRouter();
  const { id: propertyId } = useParams();

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);

  const [form, setForm] = useState({
    unit: "",
    type: "",
  });

  /* =====================
     LOAD PROPERTY
  ===================== */
  useEffect(() => {
    if (!propertyId) return;

    async function loadProperty() {
      try {
        const res = await fetch(`/api/admin/properties/${propertyId}`, {
          credentials: "same-origin", // 🔑 FIX REAL
          cache: "no-store",
        });

        if (!res.ok) {
          // intenta leer texto por si no es JSON
          const txt = await res.text();
          throw new Error(txt || "Failed to load property");
        }

        const data = await res.json();
        setProperty(data.property || null);
      } catch (err) {
        console.error("❌ Load property error:", err);
        toast.error("Failed to load property");
        router.push("/admin/properties");
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [propertyId, router]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /* =====================
     SUBMIT
  ===================== */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.unit) {
      toast.error("Unit number is required");
      return;
    }

    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/units`, {
        method: "POST",
        credentials: "include", // 🔑 cookies Clerk
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unit: form.unit,
          type: form.type || null,
        }),
      });

      // si no es JSON, evita {}
      let json = {};
      const ct = res.headers.get("content-type");
      if (ct && ct.includes("application/json")) {
        json = await res.json();
      } else {
        const txt = await res.text();
        throw new Error(txt || "Failed to create unit");
      }

      if (!res.ok) {
        console.error("❌ Backend response:", json);
        throw new Error(json.error || "Failed to create unit");
      }

      toast.success("Unit added");
      router.push(`/admin/properties/${propertyId}`);
    } catch (err) {
      console.error("❌ Create unit error:", err);
      toast.error(err.message || "Failed to create unit");
    }
  }

  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">Loading…</div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-6 pt-[130px] space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Add Unit</h1>
        <p className="text-sm text-gray-500">
          {property?.name || property?.address}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          name="unit"
          placeholder="Unit number (e.g. 101)"
          required
          className="w-full border rounded p-2"
          value={form.unit}
          onChange={handleChange}
        />

        <input
          name="type"
          placeholder="Type (optional)"
          className="w-full border rounded p-2"
          value={form.type}
          onChange={handleChange}
        />

        <button className="w-full bg-primary text-white py-2 rounded">
          Add Unit
        </button>
      </form>
    </div>
  );
}
