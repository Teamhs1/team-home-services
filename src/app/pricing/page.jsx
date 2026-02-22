"use client";

import { useState } from "react";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  async function subscribe(priceId) {
    try {
      setLoading(true);

      const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId, // 👈 SOLO priceId
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Server error");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 p-10">
      <h1 className="text-4xl font-bold">Choose Your Plan</h1>

      <div className="flex gap-8">
        <div className="border p-6 rounded-xl shadow">
          <h2 className="text-2xl font-semibold">Growth</h2>
          <p className="text-3xl font-bold mt-4">$149 / month</p>

          <button
            onClick={() => subscribe("price_1T3SRB2OdTNMGPuuSCSeCke1")}
            disabled={loading}
            className="mt-6 bg-black text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Processing..." : "Subscribe"}
          </button>
        </div>
      </div>
    </div>
  );
}
