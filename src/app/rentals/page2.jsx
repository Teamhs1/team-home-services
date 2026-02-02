"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import MiniImageSlider from "@/components/MiniImageSlider";
import { BedDouble, Bath, Car, Calendar } from "lucide-react";

export default function RentalsPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const role = user?.publicMetadata?.role;
  const isAdmin = role === "admin";

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");
  const [minBeds, setMinBeds] = useState("any");
  const [withParking, setWithParking] = useState(false);

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
  const filteredUnits = units.filter((u) => {
    if (maxPrice && Number(u.rent_price) > Number(maxPrice)) return false;

    if (minBeds !== "any") {
      const beds = Number(u.bedrooms);
      if (beds < Number(minBeds)) return false;
    }

    if (withParking && (!u.parking_spots || u.parking_spots <= 0)) {
      return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Admin badge */}
      {isAdmin && (
        <div className="mb-6 rounded-lg bg-yellow-100 text-yellow-800 px-4 py-2 text-sm">
          🔒 Admin preview — Rentals disabled for public
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">Available Rentals</h1>
      {/* FILTERS */}
      <div className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4 shadow-sm">
        {/* Max price */}
        <div className="flex flex-col text-sm">
          <label className="text-gray-500">Max price</label>
          <input
            type="number"
            placeholder="$"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-28 rounded-md border px-2 py-1"
          />
        </div>

        {/* Min beds */}
        <div className="flex flex-col text-sm">
          <label className="text-gray-500">Bedrooms</label>
          <select
            value={minBeds}
            onChange={(e) => setMinBeds(e.target.value)}
            className="rounded-md border px-2 py-1"
          >
            <option value="any">Any</option>
            <option value="0">Bachelor</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
          </select>
        </div>

        {/* Parking */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={withParking}
            onChange={(e) => setWithParking(e.target.checked)}
          />
          Parking
        </label>

        {/* Reset */}
        <button
          onClick={() => {
            setMaxPrice("");
            setMinBeds("any");
            setWithParking(false);
          }}
          className="ml-auto text-sm text-gray-500 hover:text-primary"
        >
          Reset filters
        </button>
      </div>

      {units.length === 0 ? (
        <p className="text-gray-500">No rentals available.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUnits.map((u) => {
            const images = Array.isArray(u.images)
              ? u.images
              : typeof u.images === "string"
                ? u.images.replace(/[{}"]/g, "").split(",")
                : [];

            const cover = images?.[0];

            return (
              <Link
                key={u.id}
                href={`/rentals/${u.id}`}
                className="group rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition"
              >
                {/* IMAGE */}
                <div className="relative aspect-[4/3] bg-gray-200">
                  <MiniImageSlider images={images} />
                </div>

                {/* INFO */}
                <div className="p-4 space-y-2">
                  {/* Address */}
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    📍 {u.property?.address || "Address not available"}
                  </p>

                  {/* Title */}
                  <h2 className="text-lg font-semibold">
                    Unit {u.unit || "-"}
                  </h2>

                  {/* Price */}
                  <p className="text-primary font-bold text-lg">
                    ${u.rent_price}
                    <span className="text-sm font-normal text-gray-500">
                      {" "}
                      / month
                    </span>
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-4 w-4" />
                      {Number(u.bedrooms) === 0
                        ? "Bachelor"
                        : `${u.bedrooms || "-"} Beds`}
                    </span>

                    <span className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {u.bathrooms || "-"} Bath
                    </span>

                    {u.parking_spots > 0 && (
                      <span className="flex items-center gap-1">
                        <Car className="h-4 w-4" />
                        Parking
                      </span>
                    )}
                  </div>

                  {/* Availability */}
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <Calendar className="h-4 w-4" />
                    {u.available_from
                      ? `Available ${new Date(u.available_from).toLocaleDateString()}`
                      : "Available now"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
