"use client";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
  KeyRound,
  MapPin,
  Home,
  Tag,
  AlertTriangle,
  LayoutGrid,
  List,
} from "lucide-react";

export default function DashboardKeysList() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "list";
    return localStorage.getItem("dashboard_keys_view") || "list";
  });

  const [selectedProperty, setSelectedProperty] = useState("all");

  /* =====================
     LOAD KEYS
  ===================== */
  useEffect(() => {
    async function loadKeys() {
      try {
        const res = await fetch("/api/keys", {
          cache: "no-store",
          credentials: "include",
        });
        const json = await res.json();
        setKeys(json.data || []);
      } catch (err) {
        console.error("Load keys error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadKeys();
  }, []);

  // 📱 Mobile siempre grid
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setViewMode("grid");
    }
  }, []);

  // 💾 Persist view mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboard_keys_view", viewMode);
    }
  }, [viewMode]);

  /* =====================
     HELPERS (UNIFIED STYLES)
  ===================== */
  function getStatusStyles(status) {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700";
      case "missing":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700"; // assigned / others
    }
  }

  function getReportedStyle(isReported) {
    return isReported ? "bg-red-50 border-red-200" : "";
  }

  /* =====================
     PROPERTIES (DERIVED)
  ===================== */
  const properties = useMemo(() => {
    return Array.from(
      new Map(
        keys
          .filter((k) => k.properties)
          .map((k) => [k.properties.id, k.properties])
      ).values()
    );
  }, [keys]);

  /* =====================
     FILTERED KEYS
  ===================== */
  const filteredKeys =
    selectedProperty === "all"
      ? keys
      : keys.filter(
          (k) => String(k.properties?.id) === String(selectedProperty)
        );

  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Loading keys…
      </div>
    );
  }

  return (
    <main className="px-4 sm:px-6 pt-[130px] max-w-[1600px] mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">🔑 Keys</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredKeys.length} key
            {filteredKeys.length !== 1 && "s"}
          </p>
        </div>

        <div className="flex gap-2">
          {/* PROPERTY FILTER */}
          {properties.length > 1 && (
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-white"
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.address}
                </option>
              ))}
            </select>
          )}

          {/* VIEW TOGGLE */}
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="hidden sm:flex items-center gap-2 border px-3 py-2 rounded-lg"
          >
            {viewMode === "grid" ? (
              <List size={16} />
            ) : (
              <LayoutGrid size={16} />
            )}
          </button>
        </div>
      </div>

      {/* EMPTY */}
      {filteredKeys.length === 0 && (
        <div className="mt-20 text-center text-gray-500">
          No keys found for this property.
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === "grid" && filteredKeys.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredKeys.map((key) => (
            <Link
              key={key.id}
              href={`/dashboard/keys/${key.tag_code}`}
              className="block"
            >
              <div
                className={`cursor-pointer border rounded-xl shadow-sm p-5 hover:shadow-md hover:-translate-y-1 transition ${
                  key.is_reported
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex justify-between mb-3">
                  <div className="font-semibold flex items-center gap-2">
                    <KeyRound size={18} className="text-primary" />
                    {key.tag_code}
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full ${getStatusStyles(
                      key.status
                    )}`}
                  >
                    {key.status}
                  </span>
                </div>

                {key.is_reported && (
                  <div className="flex items-center gap-2 text-red-700 text-sm font-semibold mb-2">
                    <AlertTriangle size={14} />
                    Reported
                  </div>
                )}

                <div className="text-sm text-gray-600 space-y-1">
                  <p className="flex gap-2">
                    <MapPin size={14} />
                    {key.properties?.address || "—"}
                  </p>

                  {key.unit && (
                    <p className="flex gap-2">
                      <Home size={14} /> Unit {key.unit}
                    </p>
                  )}

                  {key.type && (
                    <p className="flex gap-2">
                      <Tag size={14} /> {key.type}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && filteredKeys.length > 0 && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Tag</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeys.map((k) => (
                <tr
                  key={k.id}
                  onClick={() =>
                    (window.location.href = `/dashboard/keys/${k.tag_code}`)
                  }
                  className={`border-t hover:bg-gray-50 cursor-pointer ${getReportedStyle(
                    k.is_reported
                  )}`}
                >
                  <td className="px-4 py-2 font-medium">{k.tag_code}</td>
                  <td className="px-4 py-2">{k.properties?.address || "—"}</td>
                  <td className="px-4 py-2">{k.unit || "—"}</td>
                  <td className="px-4 py-2">{k.type || "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full inline-block ${getStatusStyles(
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
    </main>
  );
}
