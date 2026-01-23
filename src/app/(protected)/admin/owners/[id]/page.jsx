"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function OwnerDetailPage() {
  const { id } = useParams();
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOwner() {
      const res = await fetch(`/api/admin/owners/${id}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      setOwner(data.owner);
      setLoading(false);
    }

    loadOwner();
  }, [id]);

  if (loading) return <div className="p-10">Loading owner…</div>;
  if (!owner) return <div className="p-10">Owner not found</div>;

  async function save(field, value) {
    await fetch(`/api/admin/owners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ [field]: value }),
    });
    toast.success("Owner updated");
  }

  return (
    <div className="p-8 pt-[130px] max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Owner</h1>

      <input
        value={owner.full_name}
        onChange={(e) => setOwner({ ...owner, full_name: e.target.value })}
        onBlur={() => save("full_name", owner.full_name)}
        className="w-full border-b text-xl font-medium focus:outline-none"
      />

      <input
        value={owner.email || ""}
        onChange={(e) => setOwner({ ...owner, email: e.target.value })}
        onBlur={() => save("email", owner.email)}
        placeholder="Email"
        className="w-full border rounded p-2"
      />
    </div>
  );
}
