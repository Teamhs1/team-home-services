"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function AssignOwnerPage() {
  const { id: propertyId } = useParams();
  const router = useRouter();

  const [owners, setOwners] = useState([]);
  const [ownerId, setOwnerId] = useState("");
  const [saving, setSaving] = useState(false);

  /* =====================
     LOAD OWNERS (TU API)
  ===================== */
  useEffect(() => {
    async function loadOwners() {
      const res = await fetch("/api/admin/owners", {
        credentials: "include",
      });

      const data = await res.json();
      setOwners(data.owners || []);
    }

    loadOwners();
  }, []);

  /* =====================
     ASSIGN OWNER
  ===================== */
  async function saveOwner() {
    if (!ownerId) return;

    try {
      setSaving(true);

      const res = await fetch(
        `/api/admin/properties/${propertyId}/assign-owner`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ owner_id: ownerId }),
        },
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      router.push(`/admin/properties/${propertyId}`);
    } catch (err) {
      alert(err.message || "Failed to assign owner");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 pt-[130px] max-w-xl mx-auto space-y-6">
      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold">Assign Owner</h1>

      {/* DROPDOWN */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Owner</label>

        <select
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          className="w-full border rounded-lg p-2"
        >
          <option value="">Select an owner…</option>

          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.full_name}
              {o.email ? ` · ${o.email}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3">
        <button
          onClick={saveOwner}
          disabled={!ownerId || saving}
          className="bg-primary text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Save
        </button>

        <button
          onClick={() => router.back()}
          className="border px-4 py-2 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
