"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "react-qr-code";
import {
  KeyRound,
  Copy,
  CheckCircle,
  XCircle,
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

  // Fetch key
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/keys/${id}`);
        const json = await res.json();

        if (!res.ok) {
          setKeyData(null);
        } else {
          setKeyData(json.key);
        }
      } catch {
        setKeyData(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

  if (loading)
    return <div className="p-10 text-gray-500 text-lg">Loading key...</div>;

  if (!keyData)
    return (
      <div className="p-10 text-red-600 font-semibold text-lg">
        Key not found: {id}
      </div>
    );

  // Status badge
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

  // Copy tag_code
  function copyCode() {
    navigator.clipboard.writeText(keyData.tag_code);
    toast.success("Copied to clipboard!");
  }

  function getHolderName(custody) {
    if (!custody) return "Available";

    if (custody.holder_label) return custody.holder_label;

    if (custody.profiles?.full_name) return custody.profiles.full_name;

    return "Assigned";
  }

  return (
    <div className="p-8 max-w-4xl mx-auto mt-20">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">{keyData.tag_code}</h2>
            <p className="text-gray-500">Unique key identifier</p>
          </div>

          <div
            className={`px-4 py-2 rounded-full border font-semibold capitalize text-sm ${
              statusColors[keyData.status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {statusLabel[keyData.status] || keyData.status}
          </div>
        </div>
        {/* CURRENT HOLDER */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-1">Currently held by</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-800 font-semibold">
            {getHolderName(keyData.custody)}
          </div>
        </div>

        {/* QR CODE */}
        <div className="flex justify-center mb-10">
          <div className="bg-white p-4 shadow rounded-xl border">
            <QRCode
              value={`https://teamhomeservices.ca/admin/keys/${keyData.tag_code}`}
              size={200}
            />
          </div>
        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
          {/* Property */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-1" />
            <div>
              <p className="text-sm text-gray-500">Property Address</p>
              <p className="font-semibold">{keyData.property_address}</p>
            </div>
          </div>

          {/* Unit */}
          <div className="flex items-start gap-3">
            <Home className="w-5 h-5 text-primary mt-1" />
            <div>
              <p className="text-sm text-gray-500">Unit</p>
              <p className="font-semibold">{keyData.unit || "N/A"}</p>
            </div>
          </div>

          {/* Building */}
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-primary mt-1" />
            <div>
              <p className="text-sm text-gray-500">Building</p>
              <p className="font-semibold">{keyData.building || "N/A"}</p>
            </div>
          </div>

          {/* Type */}
          <div className="flex items-start gap-3">
            <Layers className="w-5 h-5 text-primary mt-1" />
            <div>
              <p className="text-sm text-gray-500">Key Type</p>
              <p className="font-semibold">{keyData.type || "N/A"}</p>
            </div>
          </div>

          {/* Floor */}
          <div className="flex items-start gap-3">
            <Hash className="w-5 h-5 text-primary mt-1" />
            <div>
              <p className="text-sm text-gray-500">Floor</p>
              <p className="font-semibold">{keyData.floor || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}
