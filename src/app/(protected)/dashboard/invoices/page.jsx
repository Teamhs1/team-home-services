"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";

export default function InvoicesPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [selected, setSelected] = useState([]);

  const isSuperAdmin = role === "super_admin";
  const isCompanyAdmin = role === "admin";
  const isAdminLevel = isSuperAdmin || isCompanyAdmin;

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

  useEffect(() => {
    async function loadInvoices() {
      try {
        const token = await getToken({ template: "supabase" });

        const [invoicesRes, profileRes] = await Promise.all([
          fetch("/api/invoices", {
            cache: "no-store",
            credentials: "include",
          }),
          fetch("/api/my/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const invoicesJson = await invoicesRes.json();
        const profileJson = await profileRes.json();

        if (!invoicesRes.ok) {
          throw new Error(invoicesJson.error || "Failed to load invoices");
        }

        setInvoices(invoicesJson.invoices || []);
        setRole(profileJson.role || null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load invoices");
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, []);

  async function archiveSelected() {
    if (selected.length === 0) return;

    const confirmed = window.confirm(`Archive ${selected.length} invoice(s)?`);
    if (!confirmed) return;

    try {
      await Promise.all(
        selected.map((id) =>
          fetch(`/api/invoices/${id}`, {
            method: "DELETE",
            credentials: "include",
          }),
        ),
      );

      setInvoices((prev) => prev.filter((i) => !selected.includes(i.id)));
      setSelected([]);
      toast.success("Invoices archived");
    } catch {
      toast.error("Error archiving invoices");
    }
  }

  return (
    <section className="p-6 space-y-6 mt-6 pt-14">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>

        {isAdminLevel && selected.length > 0 && (
          <div className="flex items-center gap-4 bg-muted px-4 py-2 border rounded-lg">
            <span className="text-sm text-muted-foreground">
              {selected.length} selected
            </span>
            <button
              onClick={archiveSelected}
              className="text-sm text-red-600 hover:underline"
            >
              Archive selected
            </button>
          </div>
        )}

        <Link
          href="/dashboard/invoices/new"
          className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
        >
          New invoice
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading invoices…
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState />
      ) : (
        <InvoicesTable
          invoices={invoices}
          setInvoices={setInvoices}
          router={router}
          selected={selected}
          isSelected={isSelected}
          toggleOne={toggleOne}
          toggleAll={toggleAll}
          isAdminLevel={isAdminLevel}
        />
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
function InvoicesTable({
  invoices,
  setInvoices,
  router,
  selected,
  isSelected,
  toggleOne,
  toggleAll,
  isAdminLevel,
}) {
  async function archiveInvoice(id) {
    const confirmed = window.confirm(
      "Are you sure you want to archive this invoice?",
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error();

      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      toast.success("Invoice archived");
    } catch {
      toast.error("Error archiving invoice");
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            {isAdminLevel && (
              <th className="px-4 py-3 w-10">
                <button onClick={toggleAll}>
                  {selected.length === invoices.length &&
                  invoices.length > 0 ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
            )}
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Property</th>
            <th className="px-4 py-3 text-left">Amount</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Created</th>
            <th className="px-4 py-3 text-left">Created by</th>
            <th className="px-4 py-3 text-left">Notes</th>
            {isAdminLevel && <th className="px-4 py-3 text-left">Actions</th>}
          </tr>
        </thead>

        <tbody>
          {invoices.map((inv) => (
            <tr
              key={inv.id}
              className="border-t hover:bg-muted/50 transition-colors"
            >
              {isAdminLevel && (
                <td className="px-4 py-3">
                  <button onClick={() => toggleOne(inv.id)}>
                    {isSelected(inv.id) ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </td>
              )}

              <td
                onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                className="px-4 py-3 capitalize cursor-pointer"
              >
                {inv.type}
              </td>

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

              <td className="px-4 py-3">
                {inv.creator?.full_name || inv.creator?.email || "—"}
              </td>

              <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">
                {inv.notes || "—"}
              </td>

              {isAdminLevel && (
                <td className="px-4 py-3">
                  <button
                    onClick={() => archiveInvoice(inv.id)}
                    className="text-red-500 hover:underline text-xs"
                  >
                    Archive
                  </button>
                </td>
              )}
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
    <span className={`px-2 py-1 rounded text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  );
}
