"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function RentalsToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar estado actual
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/app-settings", { cache: "no-store" });
        const data = await res.json();
        setEnabled(!!data?.rentals_enabled);
      } catch {
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // 🔹 Cambiar estado
  async function toggle() {
    try {
      const next = !enabled;

      const res = await fetch("/api/admin/app-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentals_enabled: next }),
      });

      if (!res.ok) throw new Error();

      setEnabled(next);
      toast.success(next ? "Rentals enabled" : "Rentals disabled");
    } catch {
      toast.error("Failed to update rentals");
    }
  }

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      className={`
        relative w-28 h-14 rounded-full transition-all duration-300
        ${enabled ? "bg-blue-600" : "bg-gray-400"}
      `}
    >
      {/* Círculo */}
      <span
        className={`
          absolute top-1 left-1 w-12 h-12 rounded-full bg-white
          shadow-md transition-transform duration-300
          ${enabled ? "translate-x-14" : "translate-x-0"}
        `}
      />

      {/* Texto */}
      <span className="absolute inset-0 flex items-center justify-center font-bold text-white text-sm">
        {enabled ? "ON" : "OFF"}
      </span>
    </button>
  );
}
