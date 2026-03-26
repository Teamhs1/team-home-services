"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function RentPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null); // 🔥 NUEVO

  const fetchPayments = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/rent-payments");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // 🔥 AUTO LATE STATUS (frontend)
      const today = new Date();

      const updated = data.map((p) => {
        if (p.status === "pending" && new Date(p.due_date) < today) {
          return { ...p, status: "late" };
        }
        return p;
      });

      setPayments(updated);
    } catch {
      toast.error("Error loading payments");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 GENERATE PAYMENTS AUTOMÁTICO
  const generatePayments = async () => {
    try {
      await fetch("/api/rent-payments/generate", {
        method: "POST",
      });
    } catch {
      console.warn("Auto generate failed");
    }
  };

  useEffect(() => {
    const init = async () => {
      await generatePayments(); // 🔥 primero genera
      await fetchPayments(); // luego carga
    };

    init();
  }, []);

  const handlePay = async (id) => {
    try {
      setPayingId(id);

      const res = await fetch("/api/rent-payments/pay", {
        method: "POST",
        body: JSON.stringify({ payment_id: id }),
      });

      if (!res.ok) throw new Error();

      toast.success("Marked as paid 💰");

      await fetchPayments();
    } catch {
      toast.error("Error updating payment");
    } finally {
      setPayingId(null);
    }
  };

  const getStatusColor = (status) => {
    if (status === "paid") return "bg-green-500/20 text-green-400";
    if (status === "late") return "bg-red-500/20 text-red-400";
    return "bg-yellow-500/20 text-yellow-400";
  };

  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Rent Payments</h1>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" />
        </div>
      )}

      {!loading && payments.length === 0 && (
        <p className="text-muted-foreground">No payments yet</p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {payments.map((p) => (
          <div
            key={p.id}
            className="bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            <h2 className="font-semibold">
              {p.leases?.tenants?.first_name} {p.leases?.tenants?.last_name}
            </h2>

            <p className="mt-2 font-bold">${p.amount}</p>

            <p className="text-sm text-muted-foreground">
              Due: {new Date(p.due_date).toLocaleDateString()}
            </p>

            <div className="mt-3">
              <span
                className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                  p.status,
                )}`}
              >
                {p.status}
              </span>
            </div>

            {p.status !== "paid" && (
              <button
                onClick={() => handlePay(p.id)}
                disabled={payingId === p.id}
                className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {payingId === p.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Mark as Paid"
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
