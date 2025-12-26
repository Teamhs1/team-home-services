"use client";
console.log("🔴 CLIENT COMPONENT LOADED 🔥");

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CreateKeyPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  const [form, setForm] = useState({
    company_id: "",
    property_id: "",
    unit: "",
    type: "",
    status: "available",
  });

  /* ============================
     LOAD COMPANIES (API)
  ============================ */
  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      const res = await fetch("/api/companies", {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to load companies");

      const data = await res.json();
      setCompanies(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Error loading companies");
    }
  }

  /* ============================
     LOAD PROPERTIES BY COMPANY (API)
  ============================ */
  useEffect(() => {
    if (!form.company_id) {
      setProperties([]);
      return;
    }

    loadProperties(form.company_id);
  }, [form.company_id]);

  async function loadProperties(companyId) {
    setLoadingProperties(true);

    try {
      const res = await fetch(`/api/admin/properties?company_id=${companyId}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to load properties");

      const data = await res.json();
      setProperties(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Error loading properties");
      setProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  }

  /* ============================
     HANDLERS
  ============================ */
  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "company_id") {
      setForm({
        company_id: value,
        property_id: "",
        unit: "",
        type: form.type,
        status: "available",
      });
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /* ============================
     DERIVED
  ============================ */
  const selectedProperty = useMemo(
    () => properties.find((p) => String(p.id) === String(form.property_id)),
    [properties, form.property_id]
  );

  /* ============================
     TAG CODE
  ============================ */
  function generateTagCode() {
    if (!selectedProperty || !form.type) return "";

    const cleanName = selectedProperty.name.replace(/[^a-zA-Z0-9]/g, "");
    const unit = form.unit ? `-U${form.unit}` : "";
    const typePart = form.type.toUpperCase();

    return `${cleanName}${unit}-${typePart}`;
  }

  /* ============================
     SUBMIT
  ============================ */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.company_id) return toast.error("Select a company");
    if (!form.property_id) return toast.error("Select a property");
    if (!form.type) return toast.error("Select a key type");

    if (form.unit && isNaN(Number(form.unit))) {
      return toast.error("Unit must be a number");
    }

    const payload = {
      property_id: form.property_id,
      unit: form.unit ? Number(form.unit) : null,
      type: form.type,
      tag_code: generateTagCode(),
      status: "available",
    };

    const res = await fetch("/api/admin/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      toast.error("Error creating key");
      return;
    }

    toast.success("Key created successfully!");
    router.push("/admin/keys");
  }

  return (
    <main className="pt-[130px] px-4">
      <div className="mx-auto max-w-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold">Add New Key</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* COMPANY */}
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <select
              name="company_id"
              className="w-full border rounded p-2"
              value={form.company_id}
              onChange={handleChange}
              required
            >
              <option value="">Select company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* PROPERTY */}
          <div>
            <label className="block text-sm font-medium mb-1">Property</label>
            <select
              name="property_id"
              className="w-full border rounded p-2"
              value={form.property_id}
              onChange={handleChange}
              disabled={!form.company_id}
              required
            >
              <option value="">
                {loadingProperties
                  ? "Loading properties..."
                  : !form.company_id
                  ? "Select company first"
                  : properties.length
                  ? "Select property"
                  : "No properties for this company"}
              </option>

              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* PREVIEW */}
          {selectedProperty && (
            <div className="rounded-lg border bg-gray-50 p-3 text-sm">
              <p>
                <strong>Company:</strong>{" "}
                {companies.find((c) => c.id === form.company_id)?.name}
              </p>
              <p>
                <strong>Property:</strong> {selectedProperty.name}
              </p>
            </div>
          )}

          {/* UNIT */}
          <input
            name="unit"
            placeholder="Unit (ex: 101)"
            className="w-full border rounded p-2"
            value={form.unit}
            onChange={handleChange}
          />

          {/* TYPE */}
          <select
            name="type"
            className="w-full border rounded p-2"
            value={form.type}
            onChange={handleChange}
            required
          >
            <option value="">Select key type</option>
            <option value="master">Master Key</option>
            <option value="mail">Mailbox</option>
            <option value="electrical">Electrical Room</option>
            <option value="mechanical">Mechanical Room</option>
            <option value="laundry">Laundry</option>
            <option value="storage">Storage</option>
            <option value="frontdoor">Front Door</option>
          </select>

          {/* TAG */}
          <div className="rounded border bg-gray-50 p-3 text-sm">
            <strong>Tag Code Preview:</strong>{" "}
            {generateTagCode() || "Select company, property & type"}
          </div>

          <button className="w-full bg-blue-600 text-white py-2 rounded">
            Add Key
          </button>
        </form>
      </div>
    </main>
  );
}
