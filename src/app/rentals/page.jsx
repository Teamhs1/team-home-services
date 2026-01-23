"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function RentalsPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const role = user?.publicMetadata?.role;
  const isAdmin = role === "admin";

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    async function loadSettingsAndRentals() {
      try {
        /* 1️⃣ Verificar si Rentals está habilitado globalmente */
        const settingsRes = await fetch("/api/app-settings", {
          cache: "no-store",
        });

        const settingsJson = await settingsRes.json();

        // ❌ SOLO bloquear si NO es admin
        if (!settingsJson?.rentals_enabled && !isAdmin) {
          router.replace("/");
          return;
        }

        setSettingsLoaded(true);

        /* 2️⃣ Cargar rentals (admin o público habilitado) */
        const res = await fetch("/api/rentals", {
          cache: "no-store",
        });

        const json = await res.json();
        setUnits(json.units || []);
      } catch (err) {
        console.error("Failed to load rentals", err);
      } finally {
        setLoading(false);
      }
    }

    loadSettingsAndRentals();
  }, [isLoaded, isAdmin, router]);

  if (loading || !settingsLoaded) {
    return <div className="p-10">Loading rentals…</div>;
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      {/* 🟡 Badge solo para admin */}
      {isAdmin && (
        <div className="mb-4 rounded-lg bg-yellow-100 text-yellow-800 px-4 py-2 text-sm">
          🔒 Admin preview — Rentals disabled for public
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6">Available Rentals</h1>

      {units.length === 0 ? (
        <p className="text-gray-500">No rentals available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {units.map((u) => (
            <Link
              key={u.id}
              href={`/rentals/${u.id}`}
              className="block border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition"
            >
              <p className="text-sm text-gray-500">
                {u.property?.address || "Address not available"}
              </p>
              <h2 className="text-xl font-semibold mt-1">
                Unit {u.unit || "-"}
              </h2>
              <p className="mt-2 text-lg font-medium">
                ${u.rent_price} / month
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
