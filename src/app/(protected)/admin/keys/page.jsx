"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function KeysPage() {
  const { getToken } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusColors = {
    available: "bg-green-500",
    checked_out: "bg-yellow-500",
    missing: "bg-red-500",
  };

  useEffect(() => {
    async function loadKeys() {
      try {
        // 👉 JWT DE CLERK → API
        const token = await getToken({ template: "supabase" });

        const res = await fetch("/api/admin/keys", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        console.log("🔑 Keys loaded:", json);

        setKeys(json.keys || []);
      } catch (err) {
        console.error("Error loading keys:", err);
      }

      setLoading(false);
    }

    loadKeys();
  }, [getToken]);

  if (loading) return <div className="p-6">Loading keys...</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Key Management 🔑</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {keys.map((key) => (
          <div key={key.id} className="rounded border p-4 shadow">
            <h2 className="text-lg font-semibold">
              {key.tag_code} — Unit {key.unit || "N/A"}
            </h2>

            <div className="mt-2 flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  statusColors[key.status] || "bg-gray-500"
                }`}
              ></span>
              <span className="capitalize">{key.status}</span>
            </div>

            {/* 👇 ABRIR DETALLE USANDO TAG_CODE (NO ID) */}
            <a
              href={`/admin/keys/${key.tag_code}`}
              className="mt-4 inline-block rounded bg-blue-600 px-3 py-1 text-white"
            >
              View QR
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
