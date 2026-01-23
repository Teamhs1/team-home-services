"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function OwnersPage() {
  const router = useRouter();
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOwners() {
      const res = await fetch("/api/admin/owners", {
        credentials: "include",
      });

      const data = await res.json();
      setOwners(data.owners || []);
      setLoading(false);
    }

    loadOwners();
  }, []);

  if (loading) return <div className="p-10">Loading owners…</div>;

  return (
    <div className="p-8 pt-[130px] space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Owners</h1>

        <button
          onClick={() => router.push("/admin/owners/create")}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Add Owner
        </button>
      </div>

      {owners.length === 0 ? (
        <p className="text-gray-500">No owners found.</p>
      ) : (
        <div className="grid gap-4">
          {owners.map((o) => (
            <button
              key={o.id}
              onClick={() => router.push(`/admin/owners/${o.id}`)}
              className="border rounded-xl p-4 bg-white hover:shadow-md text-left"
            >
              <p className="font-medium">{o.full_name}</p>
              <p className="text-sm text-gray-500">{o.email}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
