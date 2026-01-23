"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateOwnerPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveOwner() {
    if (!fullName.trim()) {
      alert("Owner name is required");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/admin/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          full_name: fullName,
          email,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      router.push("/admin/owners");
    } catch (err) {
      alert(err.message || "Failed to create owner");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 pt-[130px] max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Add Owner</h1>

      <div className="space-y-2">
        <label className="text-sm font-medium">Full name *</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="John Smith"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="john@email.com"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={saveOwner}
          disabled={saving}
          className="bg-primary text-white px-4 py-2 rounded-lg"
        >
          {saving ? "Saving..." : "Save"}
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
