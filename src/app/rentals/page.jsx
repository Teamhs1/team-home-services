"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function RentalsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  /* =====================================================
     🔐 ADMIN ONLY GUARD
  ===================================================== */
  useEffect(() => {
    if (!isLoaded) return;

    const role = user?.publicMetadata?.role;

    if (role !== "admin") {
      router.replace("/");
      return;
    }

    setAuthorized(true);
  }, [isLoaded, user, router]);

  /* =====================================================
     📦 FETCH RENTALS (solo si autorizado)
  ===================================================== */
  useEffect(() => {
    if (!authorized) return;

    async function fetchRentals() {
      try {
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

    fetchRentals();
  }, [authorized]);

  /* =====================================================
     ⏳ ESTADOS DE CARGA / VERIFICACIÓN
  ===================================================== */
  if (!isLoaded || !authorized) {
    return <div className="p-10">Checking access…</div>;
  }

  if (loading) {
    return <div className="p-10">Loading rentals…</div>;
  }

  if (units.length === 0) {
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold">Rentals</h1>
        <p className="mt-4 text-gray-500">
          No rentals available at the moment.
        </p>
      </div>
    );
  }

  /* =====================================================
     ✅ RENDER
  ===================================================== */
  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Available Rentals</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {units.map((u) => (
          <Link
            key={u.id}
            href={`/rentals/${u.id}`}
            className="
              block border rounded-xl p-6 bg-white shadow-sm
              hover:shadow-md hover:border-primary
              transition cursor-pointer
            "
          >
            <p className="text-sm text-gray-500">
              {u.property?.address || "Address not available"}
            </p>

            <h2 className="text-xl font-semibold mt-1">Unit {u.unit || "-"}</h2>

            <p className="mt-2 text-lg font-medium">${u.rent_price} / month</p>

            <p className="mt-4 text-primary font-medium">View details →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
