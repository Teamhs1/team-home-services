"use client";
import { toast } from "sonner";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  const searchParams = useSearchParams();
  const paid = searchParams.get("paid");

  // =========================
  // LOAD INVOICE (FUENTE ÚNICA)
  // =========================
  async function loadInvoice() {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        cache: "no-store",
        credentials: "include", // ✅ NECESARIO EN PRODUCCIÓN
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Invoice not available");
        router.replace("/dashboard/invoices");
        return;
      }

      setInvoice(json.invoice);
    } catch (err) {
      console.error("Failed to load invoice", err);
      toast.error("Failed to load invoice");
      router.replace("/dashboard/invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
  }, [id, paid]);

  // =========================
  // STRIPE CHECKOUT (STEP 1)
  // =========================
  async function startStripeCheckout() {
    try {
      const res = await fetch(`/api/stripe/invoices/${invoice.id}/checkout`, {
        method: "POST",
        credentials: "include", // ✅ CLAVE
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      window.location.href = json.url;
    } catch (err) {
      toast.error(err.message || "Failed to start payment");
    }
  }

  // =========================
  // MARK AS PAID
  // =========================
  async function markAsPaid() {
    if (!confirm("Mark this invoice as paid?")) return;

    try {
      const res = await fetch(`/api/invoices/${invoice.id}/mark-paid`, {
        method: "POST",
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      await loadInvoice();
    } catch (err) {
      alert(err.message || "Failed to mark as paid");
    }
  }

  // =========================
  // DELETE INVOICE (SOFT)
  // =========================
  async function deleteInvoice() {
    if (
      !confirm(
        "Are you sure you want to delete this invoice?\nThis action cannot be undone.",
      )
    )
      return;

    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Invoice deleted");

      router.push("/dashboard/invoices");
    } catch (err) {
      toast.error(err.message || "Failed to delete invoice");
    }
  }

  // =========================
  // UI STATES
  // =========================
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
  const isArchived = Boolean(invoice?.deleted_at);

  return (
    <section className="p-6 pt-14 space-y-6 max-w-3xl">
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
          label="Created by"
          value={invoice.creator?.full_name || invoice.creator?.email || "—"}
        />
        <Detail
          label="Amount"
          value={`$${(invoice.amount_cents / 100).toFixed(2)} CAD`}
        />
        <Detail label="Notes" value={invoice.notes || "—"} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {/* ======================
      CLIENT ACTIONS
  ====================== */}
        {role === "client" && invoice.status === "sent" && (
          <button
            onClick={startStripeCheckout}
            className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
          >
            Pay with Stripe
          </button>
        )}

        {/* ======================
      ADMIN / STAFF ACTIONS
  ====================== */}
        {role !== "client" && (
          <>
            {/* Send invoice */}
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/invoices/${invoice.id}/send`, {
                    method: "POST",
                    credentials: "include",
                  });

                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error);

                  await loadInvoice();

                  // ✅ POPUP AQUÍ
                  toast.success("Invoice sent successfully", {
                    description: "The client has been notified by email.",
                  });
                } catch (err) {
                  toast.error("Failed to send invoice", {
                    description: err.message,
                  });
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

            {/* Delete */}
            <button
              onClick={deleteInvoice}
              disabled={invoice.status === "paid"}
              className="px-4 py-2 rounded border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              Delete invoice
            </button>
          </>
        )}

        {/* ======================
      SHARED
  ====================== */}
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

// =========================
// UI HELPERS
// =========================
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
