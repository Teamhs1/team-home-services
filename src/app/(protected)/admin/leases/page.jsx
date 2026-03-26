"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LeasesPage() {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState(null); // 🔥 NUEVO

  const fetchLeases = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/leases");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setLeases(data);
    } catch (err) {
      toast.error("Error loading leases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeases();
  }, []);

  // 🔥 GENERATE LEASE
  const handleGenerate = async (leaseId) => {
    try {
      setGeneratingId(leaseId);

      const res = await fetch("/api/leases/generate", {
        method: "POST",
        body: JSON.stringify({ lease_id: leaseId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success("Lease generated 📄");

      // abrir documento
      window.open(data.url, "_blank");

      // refrescar lista
      await fetchLeases();
    } catch (err) {
      toast.error("Failed to generate lease");
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Leases</h1>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin w-6 h-6" />
        </div>
      )}

      {!loading && leases.length === 0 && (
        <p className="text-muted-foreground">No leases yet</p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {leases.map((lease) => (
          <div
            key={lease.id}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
          >
            {/* Tenant */}
            <h2 className="text-lg font-semibold">
              {lease.tenants?.first_name} {lease.tenants?.last_name}
            </h2>

            <p className="text-sm text-muted-foreground">
              {lease.tenants?.email}
            </p>

            {/* Rent */}
            <p className="mt-3 text-lg font-bold">${lease.rent_amount}/month</p>

            {/* Dates */}
            <p className="text-sm text-muted-foreground mt-1">
              Start: {new Date(lease.start_date).toLocaleDateString()}
            </p>

            {/* Status */}
            <div className="mt-3">
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                {lease.status}
              </span>
            </div>

            {/* 🔥 ACTIONS */}
            <div className="mt-4 flex flex-col gap-2">
              {/* Generate */}
              <button
                onClick={() => handleGenerate(lease.id)}
                disabled={generatingId === lease.id}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {generatingId === lease.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Generate Lease"
                )}
              </button>

              {/* View */}
              {lease.pdf_url && (
                <a
                  href={lease.pdf_url}
                  target="_blank"
                  className="text-sm text-blue-400 underline text-center"
                >
                  View Lease
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
