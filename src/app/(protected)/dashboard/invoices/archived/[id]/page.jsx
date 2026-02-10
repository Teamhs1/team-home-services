"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ArchivedInvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* =========================
     LOAD ARCHIVED INVOICE
  ========================= */
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/admin/invoices/archived/${id}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load invoice");
        }

        if (!cancelled) {
          setInvoice(json.invoice);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Invoice not found");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading archived invoice…
      </div>
    );
  }

  /* =========================
     ERROR
  ========================= */
  if (error || !invoice) {
    return (
      <section className="p-6 space-y-4 max-w-3xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="text-sm text-red-600">
          {error || "Invoice not found"}
        </div>
      </section>
    );
  }

  /* =========================
     CONTENT
  ========================= */
  return (
    <section className="p-6 pt-14 space-y-6 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to archived invoices
      </button>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold capitalize">
            {invoice.type} invoice
          </h1>
          <p className="text-sm text-muted-foreground">Archived invoice</p>
        </div>

        <span className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
          Archived
        </span>
      </div>

      {/* Details */}
      <div className="border rounded-lg p-6 space-y-4 text-sm">
        <Detail label="Property" value={invoice.properties?.address || "—"} />

        <Detail label="Unit" value={invoice.units?.unit || "—"} />

        <Detail
          label="Amount"
          value={
            typeof invoice.amount_cents === "number"
              ? `$${(invoice.amount_cents / 100).toFixed(2)} CAD`
              : "—"
          }
        />

        <Detail label="Notes" value={invoice.notes || "—"} />

        <Detail
          label="Deleted at"
          value={
            invoice.deleted_at
              ? new Date(invoice.deleted_at).toLocaleString()
              : "—"
          }
        />
      </div>
    </section>
  );
}

/* =========================
   UI HELPER
========================= */
function Detail({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
