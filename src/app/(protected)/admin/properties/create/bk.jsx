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
        console.error(err);
        toast.error("Failed to load companies");
      } finally {
        if (mounted) setLoadingCompanies(false);
      }
    }

    loadCompanies();
    return () => (mounted = false);
  }, [getToken]);

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

  /* =====================
     SUBMIT
  ===================== */
  async function handleSubmit(e) {
    e.preventDefault();

    const address = buildAddress();
    if (!address || !form.company_id) {
      toast.error("Missing required fields");
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

      if (!res.ok) {
        throw new Error(json?.error || "Failed to create property");
      }

      toast.success("Property created successfully");
      router.push("/admin/properties");
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-lg p-6 pt-[130px]">
      <h1 className="mb-6 text-3xl font-semibold">Add New Property</h1>

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

        <button className="w-full bg-blue-600 text-white py-2 rounded">
          Add Property
        </button>
      </form>
    </div>
  );
}
