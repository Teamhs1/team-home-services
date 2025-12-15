"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/supabaseClient";
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

  // 🔒 mantenemos esto EXACTO
  const [selectedCompany, setSelectedCompany] = useState("all");

  // ✅ MISMO estado que Companies
  const [viewMode, setViewMode] = useState("list");

  const router = useRouter();

  /* =====================
     LOAD COMPANIES
  ===================== */
  useEffect(() => {
    async function loadCompanies() {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");

      if (!error) setCompanies(data || []);
    }

    loadCompanies();
  }, []);

  /* =====================
     LOAD PROPERTIES
  ===================== */
  useEffect(() => {
    async function loadProperties() {
      const { data, error } = await supabase
        .from("properties")
        .select(
          `
          id,
          name,
          address,
          unit,
          company_id,
          companies:company_id (
            id,
            name
          ),
          owners:owner_id (
            id,
            full_name
          )
        `
        )
        .order("name");

      if (!error) setProperties(data || []);
      setLoading(false);
    }

    loadProperties();
  }, []);

  // 🔒 Force grid on mobile (IGUAL a Companies)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setViewMode("grid");
    }
  }, []);

  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Loading properties...
      </div>
    );
  }

  /* =====================
     FILTER BY COMPANY
  ===================== */
  const filteredProperties =
    selectedCompany === "all"
      ? properties
      : properties.filter((p) => p.company_id === selectedCompany);

  return (
    <main className="px-4 sm:px-6 pt-[130px] max-w-[1600px] mx-auto space-y-6">
      {/* HEADER (igual a Companies) */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Properties</h1>

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

      {/* FILTER */}
      <div className="max-w-xs">
        <label className="block text-sm font-medium mb-1">
          Filter by Company
        </label>

        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="all">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* EMPTY */}
      {filteredProperties.length === 0 && (
        <p className="text-gray-500 mt-20 text-center">
          No properties found for this company.
        </p>
      )}

      {/* LIST VIEW (DEFAULT DESKTOP) */}
      {viewMode === "list" && filteredProperties.length > 0 ? (
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
                  <td className="px-4 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0"
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProperties.map((p) => (
            <div
              key={p.id}
              className="border rounded-2xl bg-white shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold mb-1 truncate">
                  {p.name}
                </h2>
                <p className="text-sm text-gray-600">{p.address}</p>
                {p.unit && (
                  <p className="text-sm text-gray-600">Unit {p.unit}</p>
                )}
                <p className="text-sm mt-2 text-gray-600">
                  {p.companies?.name || "No company"}
                </p>
              </div>

              <div className="pt-4 flex flex-col gap-2 text-sm">
                <Link
                  href={`/admin/properties/${p.id}`}
                  className="text-blue-600 hover:underline"
                >
                  View Property →
                </Link>
                <Link
                  href={`/admin/properties/${p.id}/edit`}
                  className="text-blue-600 hover:underline"
                >
                  Edit Property →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
