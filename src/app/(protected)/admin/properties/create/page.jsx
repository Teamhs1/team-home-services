"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

export default function CreatePropertyPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [form, setForm] = useState({
    street_number: "",
    street_name: "",
    unit: "",
    company_id: "",
  });

  /* =====================
     LOAD COMPANIES
  ===================== */
  useEffect(() => {
    let mounted = true;

    async function loadCompanies() {
      try {
        const token = await getToken();

        const res = await fetch("/api/admin/companies", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to load companies");

        const data = await res.json();
        if (mounted) setCompanies(data || []);
      } catch (err) {
        console.error("LOAD COMPANIES ERROR:", err);
        toast.error("Failed to load companies");
      } finally {
        if (mounted) setLoadingCompanies(false);
      }
    }

    loadCompanies();
    return () => (mounted = false);
  }, [getToken]);

  /* =====================
     FORM HELPERS
  ===================== */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function buildAddress() {
    const num = form.street_number.trim();
    const name = form.street_name.trim();
    const unit = form.unit.trim();

    if (!num || !name) return "";
    return unit ? `${num} ${name} Unit ${unit}` : `${num} ${name}`;
  }

  const selectedCompany = companies.find((c) => c.id === form.company_id);
  const selectedOwner = selectedCompany?.owners || null;

  /* =====================
   SUBMIT
===================== */
  async function handleSubmit(e) {
    e.preventDefault();

    const address = buildAddress();

    if (!address || !form.company_id) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      const token = await getToken();

      const res = await fetch("/api/admin/properties/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          street_number: form.street_number,
          street_name: form.street_name,
          unit: form.unit || null,
          name: address,
          address,
          company_id: form.company_id,
        }),
      });

      const json = await res.json();

      // ❌ ERROR DE NEGOCIO (NO THROW)
      if (!res.ok) {
        toast.error(
          json?.error ||
            "Unable to create property. Please review the information and try again.",
          {
            description:
              json?.error ===
              "This property is already registered under this company."
                ? "This address already exists for the selected company."
                : undefined,
          }
        );
        return;
      }

      // ✅ SUCCESS
      toast.success("Property created successfully");
      router.push("/admin/properties");
    } catch (err) {
      console.error("CREATE PROPERTY ERROR:", err);

      toast.error("Unexpected error", {
        description:
          "Something went wrong while creating the property. Please try again.",
      });
    }
  }

  /* =====================
     UI
  ===================== */
  return (
    <div className="mx-auto max-w-lg p-6 pt-[130px] space-y-6">
      <h1 className="text-3xl font-semibold">Add New Property</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          name="street_number"
          placeholder="Street Number"
          required
          className="w-full border rounded p-2"
          value={form.street_number}
          onChange={handleChange}
        />

        <input
          name="street_name"
          placeholder="Street Name"
          required
          className="w-full border rounded p-2"
          value={form.street_name}
          onChange={handleChange}
        />

        <input
          name="unit"
          placeholder="Unit (optional)"
          className="w-full border rounded p-2"
          value={form.unit}
          onChange={handleChange}
        />

        {/* COMPANY */}
        {loadingCompanies ? (
          <p className="text-sm text-gray-500">Loading companies…</p>
        ) : (
          <select
            name="company_id"
            className="w-full border rounded p-2"
            value={form.company_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Company --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* OWNER (READ ONLY) */}
        <div className="border rounded p-3 bg-gray-50">
          <label className="block text-sm text-gray-600">Owner</label>

          <p className="font-medium">
            {selectedCompany?.owner?.full_name || "No owner assigned"}
          </p>

          <p className="text-xs text-gray-500">Auto-assigned from company</p>
        </div>

        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          Add Property
        </button>
      </form>
    </div>
  );
}
