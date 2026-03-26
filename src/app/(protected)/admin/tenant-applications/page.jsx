"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Check,
  X,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

export default function TenantApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tenant-applications");
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Error loading applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (id) => {
    try {
      setApprovingId(id);

      const res = await fetch("/api/tenant-applications/approve", {
        method: "POST",
        body: JSON.stringify({ application_id: id }),
      });

      if (!res.ok) throw new Error();

      toast.success("Tenant created successfully 🚀");
      await fetchApplications();
    } catch (err) {
      toast.error("Failed to approve application");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id) => {
    toast("Rejected (implement later)");
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    }
  };

  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenant Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and manage incoming tenant applications
          </p>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin w-6 h-6" />
        </div>
      )}

      {/* EMPTY */}
      {!loading && applications.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No applications yet
        </div>
      )}

      {/* GRID */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {applications.map((app) => (
          <div
            key={app.id}
            onClick={() => router.push(`/admin/tenant-applications/${app.id}`)}
            className="group cursor-pointer bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-300"
          >
            {/* HEADER */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {app.first_name} {app.last_name}
                </h2>
                {app.unit && (
                  <p className="text-xs text-gray-500 mt-1">
                    🏠 Unit {app.unit.unit} · ${app.unit.rent_price}/mo
                  </p>
                )}
                {app.property && (
                  <p className="text-xs text-gray-500 mt-1">
                    📍 {app.property.address}
                  </p>
                )}

                {app.company && (
                  <p className="text-xs text-gray-400">🏢 {app.company.name}</p>
                )}
                <p className="text-xs text-gray-500">
                  Application ID: {app.id.slice(0, 8)}
                </p>
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-full border ${getStatusStyle(
                  app.status,
                )}`}
              >
                {app.status}
              </span>
            </div>

            {/* INFO */}
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                {app.email}
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                {app.phone}
              </div>

              {app.employer_name && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  {app.employer_name}
                </div>
              )}

              {app.income && (
                <div className="flex items-center gap-2 font-medium text-gray-800">
                  <DollarSign className="w-4 h-4 text-green-500" />$
                  {Number(app.income).toLocaleString()}/mo
                </div>
              )}
            </div>

            {/* DIVIDER */}
            <div className="h-px bg-gray-200 my-4" />

            {/* ACTIONS */}
            {app.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(app.id);
                  }}
                  disabled={approvingId === app.id}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-50"
                >
                  {approvingId === app.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Approve
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(app.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
