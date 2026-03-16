"use client";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";

import {
  KeyRound,
  MapPin,
  Home,
  Tag,
  AlertTriangle,
  LayoutGrid,
  List,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function DashboardKeysList() {
  const { user } = useUser();

  const [role, setRole] = useState(null);

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "list";
    return localStorage.getItem("dashboard_keys_view") || "list";
  });

  const [selectedProperty, setSelectedProperty] = useState("all");

  /* =====================
     LOAD ROLE
  ===================== */
  useEffect(() => {
    async function loadRole() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();
        setRole(data.role);
      } catch (err) {
        console.error("Role load error:", err);
      }
    }

    if (user?.id) loadRole();
  }, [user]);

  const isAdminLevel =
    role === "admin" || role === "client" || role === "super_admin";

  const [billingEnabled, setBillingEnabled] = useState(true);

  const canManageKeys = isAdminLevel && billingEnabled;

  useEffect(() => {
    async function loadBilling() {
      try {
        const res = await fetch("/api/company/billing", {
          credentials: "include",
        });

        if (!res.ok) return;

        const json = await res.json();
        setBillingEnabled(json.billing_enabled ?? true);
      } catch (err) {
        console.error("Billing load error:", err);
      }
    }

    loadBilling();
  }, []);
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

  /* =====================
     DELETE KEY
  ===================== */
  async function handleDeleteKey(keyId, tagCode) {
    const ok = confirm(`Delete key ${tagCode}?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/keys/${keyId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

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
     HELPERS
  ===================== */
  function getStatusStyles(status) {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700";
      case "missing":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  }

  function getReportedStyle(isReported) {
    return isReported ? "bg-red-50 border-red-200" : "";
  }

  /* =====================
     PROPERTIES
  ===================== */
  const properties = useMemo(() => {
    return Array.from(
      new Map(
        keys
          .filter((k) => k.properties)
          .map((k) => [k.properties.id, k.properties]),
      ).values(),
    );
  }, [keys]);

  const companies = useMemo(() => {
    return Array.from(
      new Map(
        keys
          .filter((k) => k.properties?.companies)
          .map((k) => [k.properties.companies.id, k.properties.companies]),
      ).values(),
    );
  }, [keys]);

  const showCompanyColumn = companies.length > 1;

  /* =====================
     FILTERED KEYS
  ===================== */
  const filteredKeys =
    selectedProperty === "all"
      ? keys
      : keys.filter(
          (k) => String(k.properties?.id) === String(selectedProperty),
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
          {!billingEnabled && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Billing is disabled for this company. New keys cannot be created.
            </div>
          )}
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

          {/* CREATE KEY */}
          {billingEnabled && isAdminLevel && (
            <Link
              href="/dashboard/keys/create"
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary/90 transition"
            >
              <Plus size={18} /> New Key
            </Link>
          )}
        </div>
      </div>

      {/* EMPTY */}
      {filteredKeys.length === 0 && (
        <div className="mt-20 text-center text-gray-500">
          No keys found for this property.
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

                {showCompanyColumn && (
                  <th className="px-4 py-3 text-left">Company</th>
                )}

                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Status</th>

                {canManageKeys && (
                  <th className="px-2 py-3 text-center">Actions</th>
                )}
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
                    k.is_reported,
                  )}`}
                >
                  <td className="px-4 py-2 font-medium">{k.tag_code}</td>
                  <td className="px-4 py-2">{k.properties?.address || "—"}</td>

                  {showCompanyColumn && (
                    <td className="px-4 py-2">
                      {k.properties?.companies?.name ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <Building2 size={14} />
                          {k.properties.companies.name}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  )}

                  <td className="px-4 py-2">{k.unit || "—"}</td>
                  <td className="px-4 py-2">{k.type || "—"}</td>

                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full inline-block ${getStatusStyles(
                        k.status,
                      )}`}
                    >
                      {k.status}
                    </span>
                  </td>

                  {canManageKeys && (
                    <td
                      className="px-2 py-2 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-md hover:bg-gray-100">
                            <MoreVertical size={16} />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              (window.location.href = `/dashboard/keys/${k.tag_code}/edit`)
                            }
                          >
                            <Pencil size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleDeleteKey(k.id, k.tag_code)}
                            className="text-red-600"
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
