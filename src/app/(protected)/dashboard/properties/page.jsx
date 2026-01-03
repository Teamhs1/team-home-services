"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { LayoutGrid, List, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function PropertiesListPage() {
  const { isLoaded } = useUser();

  /* =====================
     ROLE REAL (SUPABASE)
  ===================== */
  const [role, setRole] = useState(null);

  const [properties, setProperties] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔒 EXISTENTE (no romper)
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  // ✅ filtro owner
  const [selectedOwner, setSelectedOwner] = useState("all");

  const router = useRouter();
  const goToProperty = (propertyId) => {
    if (role === "admin") {
      router.push(`/admin/properties/${propertyId}`);
    } else {
      router.push(`/dashboard/properties/${propertyId}`);
    }
  };

  /* =====================
     LOAD ROLE (SOURCE OF TRUTH)
  ===================== */
  useEffect(() => {
    async function loadRole() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });

        if (!res.ok) return;

        const json = await res.json();
        setRole(json.role);
      } catch (err) {
        console.error("LOAD ROLE ERROR:", err);
      }
    }

    if (isLoaded) loadRole();
  }, [isLoaded]);

  /* =====================
     LOAD COMPANIES (ADMIN ONLY)
  ===================== */
  useEffect(() => {
    if (!isLoaded || role !== "admin") return;

    async function loadCompanies() {
      try {
        const res = await fetch("/api/companies", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) return;

        const data = await res.json();
        setCompanies(data || []);
      } catch (err) {
        console.error("LOAD COMPANIES ERROR:", err);
      }
    }

    loadCompanies();
  }, [isLoaded, role]);

  /* =====================
     LOAD PROPERTIES (ROLE AWARE)
  ===================== */
  useEffect(() => {
    if (!isLoaded || !role) return;

    let mounted = true;

    async function loadProperties() {
      try {
        const endpoint =
          role === "admin"
            ? "/api/admin/properties"
            : "/api/dashboard/properties";

        const res = await fetch(endpoint, {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          console.error("API ERROR:", await res.text());
          if (mounted) setProperties([]);
          return;
        }

        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];

        if (mounted) setProperties(list);
      } catch (err) {
        console.error("LOAD PROPERTIES ERROR:", err);
        if (mounted) setProperties([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProperties();

    return () => {
      mounted = false;
    };
  }, [isLoaded, role]);

  // 📱 grid automático mobile
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setViewMode("grid");
    }
  }, []);

  // UX: reset owner al cambiar company
  useEffect(() => {
    setSelectedOwner("all");
  }, [selectedCompany]);

  /* =====================
     BLOCK RENDER UNTIL READY
  ===================== */
  if (!isLoaded || loading || !role) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Loading properties...
      </div>
    );
  }

  /* =====================
     DERIVAR OWNERS
  ===================== */
  const owners = Array.from(
    new Map(
      properties.filter((p) => p.owners).map((p) => [p.owners.id, p.owners])
    ).values()
  );

  /* =====================
     FILTRO COMBINADO
  ===================== */
  const filteredProperties = properties.filter((p) => {
    const companyId =
      typeof p.company_id === "string"
        ? p.company_id
        : p.company_id?.id || p.companies?.id || null;

    const companyMatch =
      role !== "admin" || selectedCompany === "all"
        ? true
        : String(companyId) === String(selectedCompany);

    const ownerMatch =
      selectedOwner === "all"
        ? true
        : String(p.owners?.id) === String(selectedOwner);

    return companyMatch && ownerMatch;
  });

  /* =====================
     DELETE (ADMIN ONLY)
  ===================== */
  async function handleDeleteProperty(id, name) {
    if (role !== "admin") return;

    const confirmed = confirm(
      `Are you sure you want to delete "${name}"?\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || "Unable to delete property");
        return;
      }

      setProperties((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Unexpected error deleting property");
    }
  }

  return (
    <main className="px-4 sm:px-6 pt-[130px] max-w-[1600px] mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredProperties.length} of {properties.length}{" "}
            properties
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="hidden sm:flex items-center gap-2"
          >
            {viewMode === "grid" ? (
              <List className="w-4 h-4" />
            ) : (
              <LayoutGrid className="w-4 h-4" />
            )}
          </Button>

          {role === "admin" && (
            <Link
              href="/admin/properties/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              + Add Property
            </Link>
          )}
        </div>
      </div>

      {/* FILTERS (ADMIN) */}
      {role === "admin" && (
        <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Filter by Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-white"
            >
              <option value="all">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Filter by Owner
            </label>
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-white"
            >
              <option value="all">All Owners</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* EMPTY */}
      {filteredProperties.length === 0 && (
        <p className="text-gray-500 mt-20 text-center">No properties found.</p>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && filteredProperties.length > 0 && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Property</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProperties.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => goToProperty(p.id)}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {p.address}
                    {p.unit && `, Unit ${p.unit}`}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {p.owners?.full_name || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {p.companies?.name || "—"}
                  </td>
                  <td
                    className="px-4 py-2 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/properties/${p.id}`}>
                            View Property
                          </Link>
                        </DropdownMenuItem>

                        {role === "admin" && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/properties/${p.id}/edit`}>
                                Edit Property
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteProperty(p.id, p.name)}
                            >
                              Delete Property
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* GRID VIEW */}
      {viewMode === "grid" && filteredProperties.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProperties.map((p) => (
            <div
              key={p.id}
              onClick={() => goToProperty(p.id)}
              className="group bg-white border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
            >
              {/* IMAGE / PLACEHOLDER */}
              <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-sm">
                Property
              </div>

              {/* CONTENT */}
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-base leading-tight line-clamp-2">
                    {p.name}
                  </h3>

                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 transition"
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={
                              role === "admin"
                                ? `/admin/properties/${p.id}`
                                : `dashboard/properties/${p.id}`
                            }
                          >
                            View Property
                          </Link>
                        </DropdownMenuItem>

                        {role === "admin" && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/properties/${p.id}/edit`}>
                                Edit Property
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteProperty(p.id, p.name)}
                            >
                              Delete Property
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2">
                  {p.address}
                  {p.unit && `, Unit ${p.unit}`}
                </p>

                <div className="flex flex-col text-xs text-gray-500 gap-1">
                  <span>
                    <strong>Owner:</strong> {p.owners?.full_name || "—"}
                  </span>
                  <span>
                    <strong>Company:</strong> {p.companies?.name || "—"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
