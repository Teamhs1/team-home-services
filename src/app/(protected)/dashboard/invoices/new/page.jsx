"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NewInvoicePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);

  const [form, setForm] = useState({
    type: "cleaning",
    property_id: "",
    unit_id: "",
    amount: "",
    due_date: "",
    notes: "",
  });

  /* =========================
     Load properties
  ========================= */
  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch("/api/dashboard/properties", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error();
        const json = await res.json();
        setProperties(json.data || json.properties || []);
      } catch (err) {
        console.error("Failed to load properties", err);
      }
    }

    loadProperties();
  }, []);

  /* =========================
     Load units when property changes
  ========================= */
  useEffect(() => {
    if (!form.property_id) {
      setUnits([]);
      return;
    }

    async function loadUnits() {
      try {
        const res = await fetch(`/api/units?property_id=${form.property_id}`, {
          cache: "no-store",
        });
        const json = await res.json();
        setUnits(json.units || []);
      } catch (err) {
        console.error("Failed to load units", err);
      }
    }

    loadUnits();
  }, [form.property_id]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /* =========================
     Submit
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
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">New invoice</h1>
          <p className="text-sm text-muted-foreground">
            Create an invoice linked to a property or unit
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-background p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
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

            {/* Unit + Due date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

              <Field label="Due date">
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => updateField("due_date", e.target.value)}
                  className="input w-full"
                />
              </Field>
            </div>

            {/* Amount */}
            <div className="border-t pt-6">
              <div className="max-w-sm">
                <Field label="Amount (CAD)">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => updateField("amount", e.target.value)}
                    className="input w-full text-lg font-medium"
                    placeholder="120.00"
                  />
                </Field>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t pt-6">
              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="input w-full min-h-[120px]"
                  placeholder="Details about this invoice"
                />
              </Field>
            </div>

            {/* Actions */}
            <div className="border-t pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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

/* =========================
   Field
========================= */
function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
