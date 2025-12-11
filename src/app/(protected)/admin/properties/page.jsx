"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/supabaseClient";
import Link from "next/link";

export default function PropertiesListPage() {
  const [properties, setProperties] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedManager, setSelectedManager] = useState("all");

  // Load property managers
  useEffect(() => {
    async function loadManagers() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_property_manager", true);

      if (!error) setManagers(data);
    }

    loadManagers();
  }, []);

  // Load properties with joined profile info
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
          client_id,
          profiles:client_id (
            full_name
          )
        `
        )
        .order("street_name", { ascending: true });

      if (!error) setProperties(data);

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

  // Filter logic
  const filteredProperties =
    selectedManager === "all"
      ? properties
      : properties.filter((p) => p.client_id === selectedManager);

  return (
    <div className="p-8 pt-[130px]">
      {/* HEADER ROW */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Properties</h1>

        <Link
          href="/admin/properties/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Property
        </Link>
      </div>

      {/* FILTER DROPDOWN */}
      <div className="mb-6 max-w-xs">
        <label className="block text-sm font-medium mb-1">
          Filter by Property Manager
        </label>

        <select
          value={selectedManager}
          onChange={(e) => setSelectedManager(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="all">All Managers</option>

          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* PROPERTIES GRID */}
      {filteredProperties.length === 0 ? (
        <div className="mt-20 text-center text-gray-500">
          No properties found for this manager.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition cursor-pointer"
            >
              {/* Address */}
              <h2 className="text-xl font-semibold mb-2">{p.name}</h2>

              <p className="text-gray-600 text-sm mb-1">Address: {p.address}</p>

              {p.unit && (
                <p className="text-gray-600 text-sm">Unit: {p.unit}</p>
              )}

              {/* Manager */}
              <p className="mt-3 text-sm">
                <strong>Manager:</strong>{" "}
                {p.profiles?.full_name || (
                  <span className="text-gray-500">Not assigned</span>
                )}
              </p>

              {/* Edit Button */}
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
