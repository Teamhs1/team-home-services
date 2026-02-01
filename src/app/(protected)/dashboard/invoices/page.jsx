"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await fetch("/api/invoices", {
          cache: "no-store",
        });

        const json = await res.json();
        setInvoices(json.invoices || []);
      } catch (err) {
        console.error("Failed to load invoices", err);
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, []);

  return (
    <section className="p-6 space-y-6 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>

        {/* Botón futuro */}
        <Link
          href="/dashboard/invoices/new"
          className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition"
        >
          New invoice
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading invoices…
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState />
      ) : (
        <InvoicesTable invoices={invoices} router={router} />
      )}
    </section>
  );
}

/* =========================
   Empty State
========================= */
function EmptyState() {
  return (
    <div className="border rounded-lg p-10 text-center space-y-2">
      <h3 className="text-lg font-medium">No invoices yet</h3>
      <p className="text-sm text-muted-foreground">
        Invoices created for cleaning, maintenance or rent will appear here.
      </p>
    </div>
  );
}

/* =========================
   Table
========================= */
function InvoicesTable({ invoices, router }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Property</th>
            <th className="px-4 py-3 text-left">Amount</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Created</th>
          </tr>
        </thead>

        <tbody>
          {invoices.map((inv) => (
            <tr
              key={inv.id}
              onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
              className="border-t cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <td className="px-4 py-3 capitalize">{inv.type}</td>

              <td className="px-4 py-3">{inv.properties?.address || "—"}</td>

              <td className="px-4 py-3">
                ${(inv.amount_cents / 100).toFixed(2)} CAD
              </td>

              <td className="px-4 py-3">
                <StatusBadge status={inv.status} />
              </td>

              <td className="px-4 py-3">
                {new Date(inv.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================
   Status badge
========================= */
function StatusBadge({ status }) {
  const map = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        map[status] || "bg-muted"
      }`}
    >
      {status}
    </span>
  );
}
