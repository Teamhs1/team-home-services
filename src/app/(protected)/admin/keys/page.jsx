"use client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  KeyRound,
  MapPin,
  Home,
  Tag,
  Plus,
  AlertTriangle,
  LayoutGrid,
  List,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

export default function AdminKeysList() {
  const { getToken } = useAuth();

  const [keys, setKeys] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // 🔁 UI state
  const [viewMode, setViewMode] = useState("list");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  /* =====================
     LOAD KEYS (NO TOCAR)
  ===================== */
  async function loadKeys(companyId = "all") {
    try {
      const url =
        companyId === "all"
          ? "/api/admin/keys"
          : `/api/admin/keys?company_id=${companyId}`;

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      setKeys(json.keys || []);
    } catch (err) {
      console.error("❌ Fetch keys error:", err);
    } finally {
      setLoading(false);
    }
  }

  /* =====================
     DELETE KEY (SAFE)
  ===================== */
  async function handleDeleteKey(keyId, tagCode) {
    const ok = confirm(`Delete key ${tagCode}?`);
    if (!ok) return;

    try {
      const token = await getToken();

      const res = await fetch(`/api/keys/${keyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Delete failed");

      // UI sync sin recargar
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (err) {
      console.error("❌ Delete key error:", err);
      alert("Error deleting key");
    }
  }

  /* =====================
     LOAD COMPANIES (IGUAL QUE CREATE)
  ===================== */
  useEffect(() => {
    let mounted = true;

    async function loadCompanies() {
      try {
        const token = await getToken();

        const res = await fetch("/api/companies", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to load companies");

        const data = await res.json();
        if (mounted) setCompanies(data || []);
      } catch (err) {
        console.error("❌ Load companies error:", err);
      } finally {
        if (mounted) setLoadingCompanies(false);
      }
    }

    loadCompanies();
    return () => (mounted = false);
  }, [getToken]);

  /* =====================
     LOAD PROPERTIES BY COMPANY (IGUAL QUE CREATE)
  ===================== */
  useEffect(() => {
    if (selectedCompany === "all") {
      setProperties([]);
      return;
    }

    async function loadPropertiesByCompany() {
      setLoadingProperties(true);
      try {
        const token = await getToken();

        const res = await fetch(
          `/api/admin/properties?company_id=${selectedCompany}`,
          {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to load properties");

        const data = await res.json();
        setProperties(data || []);
      } catch (err) {
        console.error("❌ Load properties error:", err);
        setProperties([]);
      } finally {
        setLoadingProperties(false);
      }
    }

    loadPropertiesByCompany();
  }, [selectedCompany, getToken]);

  useEffect(() => {
    loadKeys(selectedCompany);
  }, [selectedCompany]);

  // 📱 Grid automático en mobile
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setViewMode("grid");
    }
  }, []);

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500 pt-[130px]">
        Loading keys…
      </div>
    );

  /* =====================
     FILTERED KEYS
     (SIN company_id)
  ===================== */
  const filteredKeys = keys.filter((k) => {
    const statusMatch =
      selectedStatus === "all" ? true : k.status === selectedStatus;

    const propertyMatch =
      selectedProperty === "all"
        ? true
        : String(k.property_id) === String(selectedProperty);

    return statusMatch && propertyMatch;
  });
  const getStatusStyles = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700";
      case "missing":
        return "bg-red-100 text-red-700";
      case "assigned":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getRowStyles = (isReported) => (isReported ? "bg-red-50" : "");

  return (
    <div className="p-8 pt-[130px] space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">🔑 Keys Manager</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredKeys.length} of {keys.length} keys
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          <button
            onClick={() => (window.location.href = "/admin/keys/create")}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary/90 transition"
          >
            <Plus size={18} /> New Key
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
        {/* Company */}
        {loadingCompanies ? (
          <p className="text-sm text-gray-500">Loading companies…</p>
        ) : (
          <select
            value={selectedCompany}
            onChange={(e) => {
              setSelectedCompany(e.target.value);
              setSelectedProperty("all");
            }}
            className="border rounded-lg px-3 py-2 bg-white"
          >
            <option value="all">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Property */}
        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          className="border rounded-lg px-3 py-2 bg-white"
          disabled={selectedCompany === "all"}
        >
          <option value="all">
            {loadingProperties ? "Loading properties…" : "All Properties"}
          </option>

          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 bg-white"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="assigned">Assigned</option>
          <option value="missing">Missing</option>
        </select>
      </div>

      {/* EMPTY */}
      {filteredKeys.length === 0 && (
        <div className="mt-20 text-center text-gray-500 text-lg">
          No keys found for this filter.
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredKeys.map((key) => {
            const statusColor = getStatusStyles(key.status);
            const reportedStyle = key.is_reported
              ? "border-red-300 bg-red-50"
              : "border-gray-200 bg-white";

            return (
              <div
                key={key.id}
                onClick={() =>
                  (window.location.href = `/admin/keys/${key.tag_code}`)
                }
                className={`cursor-pointer border rounded-xl shadow-sm p-5 hover:shadow-md hover:-translate-y-1 transition ${reportedStyle}`}
              >
                <div className="flex justify-between mb-3">
                  <div className="font-bold flex items-center gap-2">
                    <KeyRound size={18} className="text-primary" />
                    {key.tag_code}
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${statusColor}`}
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

                <div className="space-y-1 text-sm text-gray-600">
                  <p className="flex gap-2">
                    <MapPin size={14} /> {key.property_address}
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

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/admin/keys/${key.tag_code}/report`;
                  }}
                  className="mt-4 w-full text-xs px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Report Issue
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && filteredKeys.length > 0 && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Tag</th>
                <th className="px-4 py-3 text-left">Property</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-2 py-3 text-center w-[56px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeys.map((k) => (
                <tr
                  key={k.id}
                  onClick={() =>
                    (window.location.href = `/admin/keys/${k.tag_code}`)
                  }
                  className={`border-t hover:bg-gray-50 cursor-pointer ${getRowStyles(
                    k.is_reported
                  )}`}
                >
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {k.tag_code}
                      </span>
                      <span className="text-xs text-gray-500">
                        {k.property_address || "—"}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {k.property_name || k.properties?.name || "—"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {k.property_address || k.properties?.address || ""}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-2">{k.unit || "—"}</td>
                  <td className="px-4 py-2">{k.type || "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(
                        k.status
                      )}`}
                    >
                      {k.status}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td
                    className="px-2 py-2 text-center w-[56px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800">
                            <MoreVertical size={16} />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() =>
                              (window.location.href = `/admin/keys/${k.tag_code}/edit`)
                            }
                          >
                            <Pencil size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleDeleteKey(k.id, k.tag_code)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
