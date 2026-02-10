"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Eye, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";

export default function ArchivedInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ selección múltiple
  const [selected, setSelected] = useState([]);
  const isSelected = (id) => selected.includes(id);

  const toggleOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (selected.length === invoices.length) {
      setSelected([]);
    } else {
      setSelected(invoices.map((i) => i.id));
    }
  };

  async function loadArchived() {
    try {
      const res = await fetch("/api/admin/invoices/archived", {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setInvoices(json.invoices || []);
    } catch (err) {
      toast.error(err.message || "Failed to load archived invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArchived();
  }, []);

  async function restoreInvoice(id) {
    if (!confirm("Restore this invoice?")) return;

    try {
      const res = await fetch(`/api/invoices/${id}/restore`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Invoice restored");
      loadArchived();
    } catch (err) {
      toast.error(err.message || "Failed to restore invoice");
    }
  }

  async function deleteForever(id) {
    const confirmed = window.confirm(
      "⚠️ This will permanently delete this invoice.\nThis action cannot be undone.\n\nContinue?",
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/invoices/${id}/force-delete`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Invoice permanently deleted");
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      setSelected((prev) => prev.filter((x) => x !== id));
    } catch (err) {
      toast.error(err.message || "Failed to delete invoice");
    }
  }

  // ✅ delete masivo
  async function deleteSelectedForever() {
    if (selected.length === 0) return;

    const confirmed = window.confirm(
      `⚠️ Permanently delete ${selected.length} invoice(s)?\nThis cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await Promise.all(
        selected.map((id) =>
          fetch(`/api/admin/invoices/${id}/force-delete`, {
            method: "DELETE",
          }),
        ),
      );

      toast.success("Invoices permanently deleted");
      setInvoices((prev) => prev.filter((i) => !selected.includes(i.id)));
      setSelected([]);
    } catch (err) {
      toast.error("Failed to delete selected invoices");
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading archived invoices…
      </div>
    );
  }

  return (
    <section className="p-6 space-y-6 mt-6 pt-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Archived invoices</h1>
          <p className="text-sm text-muted-foreground">
            Invoices that were deleted (admin only)
          </p>
        </div>

        {selected.length > 0 && (
          <button
            onClick={deleteSelectedForever}
            className="text-sm text-red-600 hover:underline"
          >
            Delete selected ({selected.length})
          </button>
        )}
      </div>

      {invoices.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No archived invoices.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 w-10">
                  <button onClick={toggleAll}>
                    {selected.length === invoices.length &&
                    invoices.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Property</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Deleted at</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t hover:bg-muted/50">
                  <td className="px-4 py-2">
                    <button onClick={() => toggleOne(inv.id)}>
                      {isSelected(inv.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </td>

                  <td className="px-4 py-2 capitalize">{inv.type}</td>
                  <td className="px-4 py-2">
                    {inv.properties?.address || "—"}
                  </td>
                  <td className="px-4 py-2">
                    ${(inv.amount_cents / 100).toFixed(2)} CAD
                  </td>
                  <td className="px-4 py-2">
                    {new Date(inv.deleted_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right flex justify-end gap-2">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/invoices/${inv.id}`)
                      }
                      className="p-2 rounded border hover:bg-muted"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => restoreInvoice(inv.id)}
                      className="p-2 rounded border hover:bg-muted"
                      title="Restore"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => deleteForever(inv.id)}
                      className="p-2 rounded border border-red-500 text-red-600 hover:bg-red-50"
                      title="Delete forever"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
