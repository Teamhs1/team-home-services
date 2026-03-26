"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  MapPin,
  FileText,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // 🔹 Fetch application
  const fetchApplication = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/tenant-applications/${id}`);
      const data = await res.json();

      setApp(data);
    } catch (err) {
      toast.error("Failed to load application");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchApplication();
  }, [id]);

  // 🔹 Approve
  const handleApprove = async () => {
    try {
      setActionLoading(true);

      const res = await fetch("/api/tenant-applications/approve", {
        method: "POST",
        body: JSON.stringify({ application_id: id }),
      });

      if (!res.ok) throw new Error();

      toast.success("Tenant approved 🚀");
      fetchApplication();
    } catch {
      toast.error("Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  // 🔹 Reject
  const handleReject = async () => {
    toast("Rejected (implement later)");
  };

  // 🔹 SCORE (🔥 PRO)
  const getScore = () => {
    if (!app?.income || !app?.unit?.rent_price) return null;

    const ratio = app.income / app.unit.rent_price;

    if (ratio >= 3) return { label: "Excellent", color: "text-green-500" };
    if (ratio >= 2) return { label: "Good", color: "text-yellow-500" };
    return { label: "Risky", color: "text-red-500" };
  };

  const score = getScore();

  if (loading) {
    return (
      <div className="flex justify-center py-40">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    );
  }

  if (!app) {
    return <div className="p-10">Application not found</div>;
  }

  return (
    <div className="pt-24 px-6 max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">
            {app.first_name} {app.last_name}
          </h1>

          <p className="text-sm text-gray-500">Application ID: {app.id}</p>

          {/* UNIT INFO */}
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            {app.unit && (
              <p>
                🏠 Unit {app.unit.unit} · ${app.unit.rent_price}/mo
              </p>
            )}
            {app.property && <p>📍 {app.property.address}</p>}
            {app.company && <p>🏢 {app.company.name}</p>}
          </div>
        </div>

        {/* ACTIONS */}
        {app.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Approve
            </button>

            <button
              onClick={handleReject}
              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* CONTACT */}
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Contact</h2>

          <p className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            {app.email}
          </p>

          <p className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            {app.phone}
          </p>
        </div>

        {/* EMPLOYMENT */}
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Employment</h2>

          <p className="flex items-center gap-2 text-sm">
            <Briefcase className="w-4 h-4 text-gray-400" />
            {app.employer_name || "N/A"}
          </p>

          <p className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="w-4 h-4 text-green-500" />$
            {Number(app.income || 0).toLocaleString()}/mo
          </p>

          {/* SCORE */}
          {score && (
            <p className={`text-sm font-semibold ${score.color}`}>
              Score: {score.label}
            </p>
          )}
        </div>

        {/* ADDRESS */}
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Address</h2>

          <p className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400" />
            {app.address || "N/A"}
          </p>

          <p className="text-sm text-gray-500">
            {app.city}, {app.province}
          </p>
        </div>

        {/* DOCUMENTS */}
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Documents</h2>

          {app.id_document && (
            <a
              href={app.id_document}
              target="_blank"
              className="text-sm text-blue-600 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View ID Document
            </a>
          )}

          {app.paystubs?.length > 0 &&
            app.paystubs.map((doc, i) => (
              <a
                key={i}
                href={doc}
                target="_blank"
                className="text-sm text-blue-600 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Paystub {i + 1}
              </a>
            ))}
        </div>
      </div>
    </div>
  );
}
