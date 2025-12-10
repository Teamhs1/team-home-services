"use client";

import { useEffect, useState } from "react";
import { KeyRound, MapPin, Home, Tag, Plus } from "lucide-react";

export default function AdminKeysList() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadKeys() {
    try {
      const res = await fetch("/api/keys", { cache: "no-store" });
      const json = await res.json();

      setKeys(json.keys || []);
      setLoading(false);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKeys();
  }, []);

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500 pt-[130px]">
        Loading keys…
      </div>
    );

  return (
    <div className="p-8 pt-[130px]">
      {/* 👆 FIX: evita que el navbar tape la página */}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">🔑 Keys Manager</h1>

        <button
          onClick={() => (window.location.href = "/admin/keys/create")}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary/90 transition"
        >
          <Plus size={18} /> New Key
        </button>
      </div>

      {/* EMPTY */}
      {keys.length === 0 && (
        <div className="mt-20 text-center text-gray-500 text-lg">
          No keys found in the database.
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {keys.map((key) => {
          const statusColor =
            key.status === "available"
              ? "bg-green-100 text-green-700"
              : key.status === "missing"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700";

          return (
            <div
              key={key.id}
              onClick={() =>
                (window.location.href = `/admin/keys/${key.tag_code}`)
              }
              className="
                cursor-pointer
                border rounded-xl shadow-sm bg-white p-5 
                hover:shadow-md hover:-translate-y-1 
                transition-all duration-200
              "
            >
              {/* TAG CODE */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-xl font-bold flex items-center gap-2">
                  <KeyRound className="text-primary" size={20} />
                  {key.tag_code}
                </div>

                {/* Status Badge */}
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}
                >
                  {key.status}
                </span>
              </div>

              {/* DETAILS */}
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  {key.property_address}
                </p>

                {key.unit && (
                  <p className="flex items-center gap-2">
                    <Home size={16} className="text-primary" />
                    Unit: {key.unit}
                  </p>
                )}

                {key.type && (
                  <p className="flex items-center gap-2">
                    <Tag size={16} className="text-primary" />
                    Type: {key.type}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
