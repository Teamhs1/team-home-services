"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, MapPin, Home, KeyRound, ArrowLeft } from "lucide-react";

/* =====================
   HELPERS
===================== */
const getStatusStyles = (status) => {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-700";
    case "assigned":
      return "bg-yellow-100 text-yellow-700";
    case "missing":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [keys, setKeys] = useState([]);

  /* =====================
     LOAD PROPERTY (NON ADMIN)
  ===================== */
  useEffect(() => {
    if (!id) return;

    async function loadProperty() {
      try {
        const res = await fetch(`/api/dashboard/properties/${id}`, {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load property");

        const data = await res.json();

        const normalizedProperty = data.property
          ? {
              ...data.property,
              company: data.property.companies || null,
            }
          : null;

        setProperty(normalizedProperty);
        setUnits(data.units || []);
        setKeys(data.keys || []);
      } catch (err) {
        console.error("❌ Load property error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Loading property…
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-10 pt-[130px] text-center text-red-600">
        Property not found
      </div>
    );
  }

  return (
    <div className="p-8 pt-[130px] space-y-8 max-w-[1400px] mx-auto">
      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="text-primary" />
          {property.name}
        </h1>

        <p className="text-gray-600 mt-1 flex items-center gap-2">
          <MapPin size={14} />
          {property.address}
        </p>

        {property.company?.name && (
          <p className="text-sm text-gray-500 mt-1">
            Company: {property.company.name}
          </p>
        )}
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-xl p-4 bg-white">
          <p className="text-sm text-gray-500">Units</p>
          <p className="text-2xl font-bold">{units.length}</p>
        </div>

        <div className="border rounded-xl p-4 bg-white">
          <p className="text-sm text-gray-500">Keys</p>
          <p className="text-2xl font-bold">{keys.length}</p>
        </div>

        <div className="border rounded-xl p-4 bg-white">
          <p className="text-sm text-gray-500">Company</p>
          <p className="font-medium">{property.company?.name || "—"}</p>
        </div>
      </div>

      {/* UNITS */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Home size={18} /> Units
        </h2>

        {units.length === 0 ? (
          <div className="text-gray-500">No units available.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.map((u) => (
              <div key={u.id} className="border rounded-xl p-4 bg-white">
                <p className="font-medium">Unit {u.unit}</p>
                {u.type && (
                  <p className="text-sm text-gray-500 capitalize">{u.type}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* KEYS */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <KeyRound size={18} /> Keys
        </h2>

        {keys.length === 0 ? (
          <div className="text-gray-500">
            No keys assigned to this property.
          </div>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Tag</th>
                  <th className="px-4 py-3 text-left">Unit</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr
                    key={k.id}
                    className={`border-t ${k.is_reported ? "bg-red-50" : ""}`}
                  >
                    <td className="px-4 py-2 font-medium">{k.tag_code}</td>
                    <td className="px-4 py-2">{k.unit || "—"}</td>
                    <td className="px-4 py-2">{k.type || "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getStatusStyles(
                          k.status
                        )}`}
                      >
                        {k.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
