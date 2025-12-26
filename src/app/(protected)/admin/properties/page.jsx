"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LayoutGrid, List, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function PropertiesListPage() {
  const [properties, setProperties] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔒 NO TOCAR (existente)
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  // ✅ NUEVO: filtro por owner
  const [selectedOwner, setSelectedOwner] = useState("all");

  const router = useRouter();

  /* =====================
     LOAD COMPANIES (API)
  ===================== */
  useEffect(() => {
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
  }, []);

  /* =====================
     LOAD PROPERTIES (API)
  ===================== */
  useEffect(() => {
    let mounted = true;

    async function loadProperties() {
      try {
        const res = await fetch("/api/admin/properties", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          console.error("API ERROR:", await res.text());
          if (mounted) setProperties([]);
          return;
        }

        const data = await res.json();
        if (mounted) setProperties(data || []);
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
  }, []);

  // 🔒 grid automático en mobile
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setViewMode("grid");
    }
  }, []);

  // ✅ UX: al cambiar company, reset owner
  useEffect(() => {
    setSelectedOwner("all");
  }, [selectedCompany]);

  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Loading properties...
      </div>
    );
  }

  /* =====================
     🔎 DERIVAR OWNERS (SIN ENDPOINT EXTRA)
  ===================== */
  const owners = Array.from(
    new Map(
      properties.filter((p) => p.owners).map((p) => [p.owners.id, p.owners])
    ).values()
  );

  /* =====================
     ✅ FILTRO COMBINADO
     Company + Owner
  ===================== */
  const filteredProperties = properties.filter((p) => {
    // Company filter
    const companyId =
      typeof p.company_id === "string"
        ? p.company_id
        : p.company_id?.id || p.companies?.id || null;

    const companyMatch =
      selectedCompany === "all"
        ? true
        : String(companyId) === String(selectedCompany);

    // Owner filter
    const ownerMatch =
      selectedOwner === "all"
        ? true
        : String(p.owners?.id) === String(selectedOwner);

    return companyMatch && ownerMatch;
  });

  /* =====================
     DELETE PROPERTY (NO ROMPER)
  ===================== */
  async function handleDeleteProperty(id, name) {
    const confirmed = confirm(
      `Are you sure you want to delete "${name}"?\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
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

          <Link
            href="/admin/properties/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            + Add Property
          </Link>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
        {/* Company */}
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

        {/* Owner */}
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

      {/* EMPTY */}
      {filteredProperties.length === 0 && (
        <p className="text-gray-500 mt-20 text-center">
          No properties found for this filter.
        </p>
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
                  onClick={() => router.push(`/admin/properties/${p.id}`)}
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

                        <DropdownMenuItem asChild>
                          <Link href={`/admin/properties/${p.id}/edit`}>
                            Edit Property
                          </Link>
                        </DropdownMenuItem>

                        {p.company_id && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/companies/${p.company_id}/members`}
                            >
                              View Members
                            </Link>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteProperty(p.id, p.name)}
                        >
                          Delete Property
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
