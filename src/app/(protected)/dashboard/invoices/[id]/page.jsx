"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoice() {
      try {
        const res = await fetch(`/api/invoices/${id}`, {
          cache: "no-store",
        });

        const json = await res.json();
        setInvoice(json.invoice);
      } catch (err) {
        console.error("Failed to load invoice", err);
      } finally {
        setLoading(false);
      }
    }

    loadInvoice();
  }, [id]);
  async function markAsPaid() {
    if (!confirm("Mark this invoice as paid?")) return;

    try {
      const res = await fetch(`/api/invoices/${invoice.id}/mark-paid`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error);
      }

      // refresca el invoice
      setInvoice(json.invoice);
    } catch (err) {
      alert(err.message || "Failed to mark as paid");
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading invoice…
      </div>
    );
  }

  if (!invoice) {
    return <div className="p-6">Invoice not found.</div>;
  }

  return (
    <section className="p-6 space-y-6 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to invoices
      </button>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold capitalize">
            {invoice.type} invoice
          </h1>
          <p className="text-sm text-muted-foreground">
            Created {new Date(invoice.created_at).toLocaleDateString()}
          </p>
        </div>

        <StatusBadge status={invoice.status} />
      </div>

      {/* Details */}
      <div className="border rounded-lg p-6 space-y-4">
        <Detail label="Property" value={invoice.properties?.address || "—"} />
        <Detail label="Unit" value={invoice.units?.unit || "—"} />
        <Detail
          label="Amount"
          value={`$${(invoice.amount_cents / 100).toFixed(2)} CAD`}
        />
        <Detail label="Notes" value={invoice.notes || "—"} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {/* Send invoice */}
        <button
          onClick={async () => {
            try {
              const res = await fetch(`/api/invoices/${invoice.id}/send`, {
                method: "POST",
              });

              const json = await res.json();
              if (!res.ok) throw new Error(json.error);

              setInvoice(json.invoice);
            } catch (err) {
              alert(err.message || "Failed to send invoice");
            }
          }}
          disabled={invoice.status !== "draft"}
          className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
        >
          Send invoice
        </button>

        {/* Mark as paid */}
        {invoice.status !== "paid" && (
          <button onClick={markAsPaid} className="px-4 py-2 rounded border">
            Mark as paid
          </button>
        )}

        {/* Print / PDF */}
        <button
          onClick={() =>
            window.open(`/dashboard/invoices/${invoice.id}/print`, "_blank")
          }
          className="px-4 py-2 rounded border"
        >
          Print / PDF
        </button>
      </div>
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded text-xs font-medium ${
        map[status] || "bg-muted"
      }`}
    >
      {status}
    </span>
  );
}
