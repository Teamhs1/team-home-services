"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LayoutGrid, List, MoreVertical, Archive } from "lucide-react";

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

  // ✅ NUEVO: selección múltiple
  const [selectedProperties, setSelectedProperties] = useState(new Set());

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
      properties
        .filter((p) => {
          if (!p.owners) return false;

          if (selectedCompany === "all") return true;

          const companyId =
            typeof p.company_id === "string"
              ? p.company_id
              : p.company_id?.id || p.companies?.id || null;

          return String(companyId) === String(selectedCompany);
        })
        .map((p) => [p.owners.id, p.owners]),
    ).values(),
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

    return companyMatch && ownerMatch && p.is_active !== false;
  });

  /* =====================
   🔢 NATURAL ADDRESS SORT
   (10 Belmont < 11 Storey)
===================== */
  function naturalAddressSort(a, b) {
    const parse = (address = "") => {
      const match = address.trim().match(/^(\d+)\s*(.*)$/);
      return match
        ? { num: parseInt(match[1], 10), text: match[2].toLowerCase() }
        : { num: Infinity, text: address.toLowerCase() };
    };

    const A = parse(a.address);
    const B = parse(b.address);

    if (A.num !== B.num) return A.num - B.num;
    return A.text.localeCompare(B.text);
  }

  const sortedProperties = [...filteredProperties].sort(naturalAddressSort);

  /* =====================
     DELETE PROPERTY (NO ROMPER)
  ===================== */
  async function handleDeleteProperty(id, name) {
    const confirmed = confirm(
      `Archive "${name}"?\nYou can restore it later if needed.`,
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/properties/${id}/archive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: false }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error || "Unable to archive property");
        return;
      }

      // 🔥 UI sync sin recargar
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: false } : p)),
      );
    } catch (err) {
      console.error(err);
      alert("Unexpected error archiving property");
    }
  }
  /* =====================
   ❌ HARD DELETE PROPERTY
===================== */
  async function handleHardDeleteProperty(id, name) {
    const confirmed = confirm(
      `⚠️ DELETE "${name}" permanently?\n\nThis action CANNOT be undone.`,
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/properties/${id}/delete`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error || "Unable to delete property");
        return;
      }

      // 🔥 remover del estado
      setProperties((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Unexpected error deleting property");
    }
  }
  /* =====================
   ✅ MULTI SELECT HELPERS
===================== */
  function togglePropertySelection(id) {
    setSelectedProperties((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedProperties(new Set());
  }

  /* =====================
   🟡 BULK ARCHIVE
===================== */
  async function handleBulkArchive() {
    if (selectedProperties.size === 0) return;

    const confirmed = confirm(
      `Archive ${selectedProperties.size} selected properties?`,
    );
    if (!confirmed) return;

    const ids = Array.from(selectedProperties);

    try {
      const res = await fetch("/api/admin/properties/archive-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error || "Bulk archive failed");
        return;
      }

      // 🔥 sync UI
      setProperties((prev) =>
        prev.map((p) => (ids.includes(p.id) ? { ...p, is_active: false } : p)),
      );

      clearSelection();
    } catch (err) {
      console.error(err);
      alert("Unexpected bulk archive error");
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

          <Link
            href="/admin/properties/archived"
            className="inline-flex items-center gap-1 mt-1 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            <Archive className="w-4 h-4" />
            View archived properties
          </Link>
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
      {/* 🟡 BULK ACTION BAR */}
      {selectedProperties.size > 0 && (
        <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-2 shadow-sm">
          <span className="text-sm font-medium">
            {selectedProperties.size} selected
          </span>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-orange-600"
              onClick={handleBulkArchive}
            >
              Archive Selected
            </Button>

            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}

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
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredProperties.length > 0 &&
                      filteredProperties.every((p) =>
                        selectedProperties.has(p.id),
                      )
                    }
                    onChange={(e) =>
                      e.target.checked
                        ? setSelectedProperties(
                            new Set(filteredProperties.map((p) => p.id)),
                          )
                        : clearSelection()
                    }
                  />
                </th>
                <th className="px-4 py-3 text-left">Property</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedProperties.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => {
                    if (selectedProperties.size === 0) {
                      router.push(`/admin/properties/${p.id}`);
                    }
                  }}
                  className={`border-t cursor-pointer transition
    ${selectedProperties.has(p.id) ? "bg-blue-50" : "hover:bg-gray-50"}
  `}
                >
                  {/* ✅ CHECKBOX */}
                  <td
                    className="px-4 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProperties.has(p.id)}
                      onChange={() => togglePropertySelection(p.id)}
                    />
                  </td>

                  {/* Property */}
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

                        {/* 🟡 ARCHIVE (soft delete) */}
                        <DropdownMenuItem
                          className="text-orange-600"
                          onClick={() => handleDeleteProperty(p.id, p.name)}
                        >
                          Archive Property
                        </DropdownMenuItem>

                        {/* 🔴 DELETE DEFINITIVO (solo si ya está archivada) */}
                        {p.is_active === false && (
                          <DropdownMenuItem
                            className="text-red-700 font-semibold"
                            onClick={() =>
                              handleHardDeleteProperty(p.id, p.name)
                            }
                          >
                            Delete Permanently
                          </DropdownMenuItem>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProperties.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/admin/properties/${p.id}`)}
              className="
          bg-white border rounded-xl p-5 cursor-pointer
          hover:shadow-md hover:border-primary transition
          relative
        "
            >
              {/* CHECKBOX */}
              <input
                type="checkbox"
                checked={selectedProperties.has(p.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => togglePropertySelection(p.id)}
                className="absolute top-4 right-4"
              />

              {/* NAME */}
              <h3 className="text-lg font-semibold">{p.name}</h3>

              {/* ADDRESS */}
              <p className="text-sm text-gray-500 mt-1">
                {p.address}
                {p.unit && `, Unit ${p.unit}`}
              </p>

              {/* META */}
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Company:</span>{" "}
                  {p.companies?.name || "—"}
                </p>
                <p>
                  <span className="font-medium">Owner:</span>{" "}
                  {p.owners?.full_name || "—"}
                </p>
              </div>

              {/* ACTIONS */}
              <div className="absolute bottom-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                    >
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

                    <DropdownMenuItem
                      className="text-orange-600"
                      onClick={() => handleDeleteProperty(p.id, p.name)}
                    >
                      Archive Property
                    </DropdownMenuItem>

                    {p.is_active === false && (
                      <DropdownMenuItem
                        className="text-red-700 font-semibold"
                        onClick={() => handleHardDeleteProperty(p.id, p.name)}
                      >
                        Delete Permanently
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
