"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle, Clock, RefreshCcw } from "lucide-react";

export default function StaffApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  async function fetchApplications() {
    setLoading(true);

    const res = await fetch("/api/admin/staff-applications", {
      credentials: "include",
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error || "Error loading applications");
    } else {
      setApplications(json.applications || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  async function markReviewed(id, reviewed) {
    const res = await fetch("/api/admin/staff-applications/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, reviewed }),
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error || "Error updating status");
    } else {
      toast.success(
        reviewed ? "✅ Application marked as reviewed" : "↩️ Marked as pending",
      );
      fetchApplications();
    }
  }

  const filteredApps =
    filter === "all"
      ? applications
      : applications.filter((a) => !!a.reviewed === (filter === "reviewed"));

  return (
    <main className="min-h-screen bg-gray-50 p-6 pt-[140px]">
      <div className="max-w-6xl mx-auto bg-white shadow rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-blue-600">
            Staff Applications
          </h1>

          <div className="flex gap-3">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg border ${
                filter === "all"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              All
            </button>

            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg border ${
                filter === "pending"
                  ? "bg-yellow-500 text-white border-yellow-500"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              Pending
            </button>

            <button
              onClick={() => setFilter("reviewed")}
              className={`px-4 py-2 rounded-lg border ${
                filter === "reviewed"
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              Reviewed
            </button>

            <button
              onClick={fetchApplications}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <RefreshCcw size={16} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-10">Loading...</p>
        ) : filteredApps.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            No applications found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <motion.table
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full text-left border-collapse"
            >
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm uppercase">
                  <th className="p-3 border-b">Name</th>
                  <th className="p-3 border-b">Email</th>
                  <th className="p-3 border-b">Phone</th>
                  <th className="p-3 border-b">Availability</th>
                  <th className="p-3 border-b">Message</th>
                  <th className="p-3 border-b text-center">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredApps.map((app) => (
                  <motion.tr
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50 border-b"
                  >
                    <td className="p-3 font-medium text-gray-800">
                      {app.full_name}
                    </td>

                    <td className="p-3 text-gray-600">{app.email}</td>
                    <td className="p-3 text-gray-600">{app.phone}</td>
                    <td className="p-3 text-gray-600">
                      {app.availability || "—"}
                    </td>
                    <td className="p-3 text-gray-600 max-w-xs truncate">
                      {app.message || "—"}
                    </td>

                    <td className="p-3 text-center">
                      {app.reviewed ? (
                        <button
                          onClick={() => markReviewed(app.id, false)}
                          className="text-green-600 hover:text-green-700 flex items-center gap-1 mx-auto"
                        >
                          <CheckCircle size={18} /> Reviewed
                        </button>
                      ) : (
                        <button
                          onClick={() => markReviewed(app.id, true)}
                          className="text-yellow-600 hover:text-yellow-700 flex items-center gap-1 mx-auto"
                        >
                          <Clock size={18} /> Pending
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </motion.table>
          </div>
        )}
      </div>
    </main>
  );
}
