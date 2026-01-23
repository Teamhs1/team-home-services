"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EditPropertyPage() {
  const { id } = useParams();
  const router = useRouter();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    unit: "",
  });

  /* =====================
     LOAD PROPERTY
  ===================== */
  useEffect(() => {
    if (!id) return;

    async function loadProperty() {
      try {
        const res = await fetch(`/api/admin/properties/${id}`, {
          cache: "no-store",
          credentials: "include",
        });

        const text = await res.text();
        const json = text ? JSON.parse(text) : {};

        if (!res.ok || !json?.property) {
          throw new Error(json?.error || "Property not found");
        }

        setProperty(json.property);
        setForm({
          name: json.property.name || "",
          address: json.property.address || "",
          unit: json.property.unit || "",
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load property");
        router.push("/admin/properties");
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [id, router]);

  /* =====================
     SUBMIT
  ===================== */
  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(json?.error || "Failed to update property");
      }

      toast.success("Property updated successfully");
      router.push(`/admin/properties/${id}`);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Loading property...
      </div>
    );
  }

  if (!property) return null;

  return (
    <main className="px-4 sm:px-6 pt-[130px] max-w-[700px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Property</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update property information
        </p>
      </div>

      {/* ⚠️ ARCHIVED WARNING */}
      {property.is_active === false && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
          ⚠️ This property is archived. You can edit it or restore it later.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Unit</label>
          <input
            type="text"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>

          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
}
