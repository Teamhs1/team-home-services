"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NewInvoicePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [role, setRole] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("all");

  const [form, setForm] = useState({
    type: "cleaning",
    property_id: "",
    unit_id: "",
    amount: "",
    due_date: "",
    notes: "",
  });

  /* =========================
     LOAD ROLE
  ========================= */
  useEffect(() => {
    async function loadMe() {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setRole(data.role);
    }
    loadMe();
  }, []);

  /* =========================
     LOAD COMPANIES (super_admin)
  ========================= */
  useEffect(() => {
    if (role !== "super_admin") return;

    async function loadCompanies() {
      const res = await fetch("/api/admin/companies");
      const data = await res.json();
      if (res.ok) setCompanies(data);
    }

    loadCompanies();
  }, [role]);

  /* =========================
     LOAD PROPERTIES
  ========================= */
  useEffect(() => {
    async function loadProperties() {
      try {
        let url = "/api/properties";

        if (role === "super_admin" && selectedCompany !== "all") {
          url += `?company_id=${selectedCompany}`;
        }

        const res = await fetch(url, {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch properties");

        const data = await res.json();
        setProperties(data || []);
      } catch (err) {
        console.error("Failed to load properties", err);
      }
    }

    if (role) loadProperties();
  }, [role, selectedCompany]);

  /* =========================
     LOAD UNITS
  ========================= */
  useEffect(() => {
    if (!form.property_id) {
      setUnits([]);
      return;
    }

    async function loadUnits() {
      const res = await fetch(`/api/units?property_id=${form.property_id}`, {
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json();
      setUnits(json.units || []);
    }

    loadUnits();
  }, [form.property_id]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /* =========================
     SUBMIT
  ========================= */
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          property_id: form.property_id || null,
          unit_id: form.unit_id || null,
          amount_cents: Math.round(Number(form.amount) * 100),
          due_date: form.due_date || null,
          notes: form.notes,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      router.push(`/dashboard/invoices/${json.invoice.id}`);
    } catch (err) {
      alert(err.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="pt-20 px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">New invoice</h1>
        </div>

        <div className="rounded-xl border bg-background p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 👑 COMPANY SELECT (only super_admin) */}
            {role === "super_admin" && (
              <Field label="Company">
                <select
                  value={selectedCompany}
                  onChange={(e) => {
                    setSelectedCompany(e.target.value);
                    updateField("property_id", "");
                  }}
                  className="input w-full"
                >
                  <option value="all">All companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* Type + Property */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Field label="Invoice type">
                <select
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                  className="input w-full"
                >
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="manual">Manual</option>
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Property">
                  <select
                    value={form.property_id}
                    onChange={(e) => updateField("property_id", e.target.value)}
                    className="input w-full"
                    required
                  >
                    <option value="">Select property</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.address}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            {/* Unit */}
            <Field label="Unit (optional)">
              <select
                value={form.unit_id}
                onChange={(e) => updateField("unit_id", e.target.value)}
                className="input w-full"
                disabled={!units.length}
              >
                <option value="">—</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unit}
                  </option>
                ))}
              </select>
            </Field>

            {/* Amount */}
            <Field label="Amount (CAD)">
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                className="input w-full"
                placeholder="$0.00"
              />
            </Field>

            {/* Notes */}
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                className="input w-full min-h-[120px]"
                placeholder="Details about this invoice"
              />
            </Field>
            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm text-muted-foreground"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create invoice
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
