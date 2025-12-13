"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/supabaseClient";
import Link from "next/link";

export default function PropertiesListPage() {
  const [properties, setProperties] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔒 mantenemos esto EXACTO para no romper
  const [selectedCompany, setSelectedCompany] = useState("all");

  /* =====================
     LOAD COMPANIES
     (sin cambios)
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
     + owner READY (no obligatorio)
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
          street_number,
          street_name,
          company_id,
          owner_id,
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
        .order("street_name", { ascending: true });

      if (!error) setProperties(data || []);
      setLoading(false);
    }

    loadProperties();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center pt-[130px] text-gray-500">
        Loading properties...
      </div>
    );
  }

  /* =====================
     FILTER BY COMPANY
     (SIN CAMBIOS → SAFE)
  ===================== */
  const filteredProperties =
    selectedCompany === "all"
      ? properties
      : properties.filter((p) => p.company_id === selectedCompany);

  return (
    <div className="p-8 pt-[130px]">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Properties</h1>

        <Link
          href="/admin/properties/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Property
        </Link>
      </div>

      {/* FILTER (Company only, safe) */}
      <div className="mb-6 max-w-xs">
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

      {/* GRID */}
      {filteredProperties.length === 0 ? (
        <div className="mt-20 text-center text-gray-500">
          No properties found for this company.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold mb-2">{p.name}</h2>

              <p className="text-gray-600 text-sm">Address: {p.address}</p>

              {p.unit && (
                <p className="text-gray-600 text-sm">Unit: {p.unit}</p>
              )}

              {/* OWNER (Company OR Individual) */}
              <p className="mt-3 text-sm">
                <strong>Owner:</strong>{" "}
                {p.companies?.name ? (
                  <span>🏢 {p.companies.name}</span>
                ) : p.owners?.full_name ? (
                  <span>👤 {p.owners.full_name}</span>
                ) : (
                  <span className="text-gray-500">Not assigned</span>
                )}
              </p>

              <Link
                href={`/admin/properties/${p.id}/edit`}
                className="inline-block mt-4 text-blue-600 font-medium hover:underline"
              >
                Edit Property →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
