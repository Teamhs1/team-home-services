"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "react-qr-code";
import {
  KeyRound,
  Copy,
  Building2,
  MapPin,
  Layers,
  Home,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

export default function KeyDetailPage() {
  const { id } = useParams();

  const [keyData, setKeyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  /* =====================
     LOAD KEY
  ===================== */
  useEffect(() => {
    if (!id) return;

    async function loadKey() {
      try {
        const res = await fetch(`/api/keys/${id}`, { cache: "no-store" });
        const json = await res.json();
        setKeyData(res.ok ? json.key : null);
      } catch (err) {
        console.error("Load key error:", err);
        setKeyData(null);
      } finally {
        setLoading(false);
      }
    }

    loadKey();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 pt-[130px] text-center text-gray-500">
        Loading key…
      </div>
    );
  }

  if (!keyData) {
    return (
      <div className="p-10 pt-[130px] text-center text-red-600 font-semibold">
        Key not found
      </div>
    );
  }

  /* =====================
     STATUS
  ===================== */
  const statusColors = {
    available: "bg-green-100 text-green-700 border-green-300",
    assigned: "bg-yellow-100 text-yellow-700 border-yellow-300",
    missing: "bg-red-100 text-red-700 border-red-300",
  };

  const statusLabel = {
    available: "Available",
    assigned: "Checked Out",
    missing: "Missing",
  };

  /* =====================
     ACTIONS
  ===================== */
  function copyCode() {
    navigator.clipboard.writeText(keyData.tag_code);
    toast.success("Copied to clipboard");
  }

  async function handleCheckout() {
    setLoadingAction(true);
    try {
      const res = await fetch(
        `/api/keys/${keyData.tag_code}/checkout
`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            holder_type: "staff",
            holder_label: "Office",
            notes: "Checked out from key detail",
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Key checked out");
      location.reload();
    } catch (err) {
      toast.error(err.message || "Failed to check out key");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleCheckin() {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/keys/${keyData.tag_code}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: "Returned from key detail",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Key checked in");
      location.reload();
    } catch (err) {
      toast.error(err.message || "Failed to check in key");
    } finally {
      setLoadingAction(false);
    }
  }

  return (
    <div className="p-8 pt-[130px] max-w-4xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <KeyRound className="w-7 h-7 text-primary" />
          Key Details
        </h1>

        <button
          onClick={copyCode}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition shadow"
        >
          <Copy className="w-4 h-4" />
          Copy Code
        </button>
      </div>

      {/* CARD */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        {/* TAG + STATUS */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">{keyData.tag_code}</h2>
            <p className="text-gray-500">Unique key identifier</p>
          </div>

          <div
            className={`px-4 py-2 rounded-full border font-semibold text-sm ${
              statusColors[keyData.status]
            }`}
          >
            {statusLabel[keyData.status]}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mb-8 flex gap-3">
          {keyData.status === "available" && (
            <button
              disabled={loadingAction}
              onClick={handleCheckout}
              className="px-4 py-2 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700 disabled:opacity-50"
            >
              Check out
            </button>
          )}

          {keyData.status === "assigned" && (
            <button
              disabled={loadingAction}
              onClick={handleCheckin}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
            >
              Check in
            </button>
          )}
        </div>

        {/* QR */}
        <div className="flex justify-center mb-10">
          <div className="bg-white p-4 shadow rounded-xl border">
            <QRCode
              value={`https://teamhomeservices.ca/dashboard/keys/${keyData.tag_code}`}
              size={180}
            />
          </div>
        </div>

        {/* INFO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
          <Info
            icon={MapPin}
            label="Property Address"
            value={keyData.property_address}
          />
          <Info icon={Home} label="Unit" value={keyData.unit} />
          <Info icon={Building2} label="Building" value={keyData.building} />
          <Info icon={Layers} label="Key Type" value={keyData.type} />
          <Info icon={Hash} label="Floor" value={keyData.floor} />
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-primary mt-1" />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold">{value || "N/A"}</p>
      </div>
    </div>
  );
}
