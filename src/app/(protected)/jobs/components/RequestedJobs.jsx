"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import JobForm from "./JobForm";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RequestedJobs({ staffList, getToken, fetchJobs }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  // 🔹 Cargar solicitudes con status = 'requested'
  async function fetchRequestedJobs() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cleaning_jobs")
      .select("*")
      .eq("status", "requested")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Error loading requested jobs");
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  }

  // ♻️ Realtime actualizaciones
  useEffect(() => {
    fetchRequestedJobs();

    const channel = supabase
      .channel("requested-jobs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleaning_jobs" },
        (payload) => {
          if (payload.new?.status === "requested") fetchRequestedJobs();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function assignToStaff(jobId, staffId) {
    try {
      const token = await getToken({ template: "supabase" });
      const res = await fetch("/api/jobs/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: jobId,
          assigned_to: staffId,
          status: "pending",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("✅ Job assigned successfully!");
      fetchRequestedJobs();
      fetchJobs?.();
      setSelectedJob(null);
    } catch (err) {
      toast.error("Error assigning job: " + err.message);
    }
  }

  if (loading)
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
      </div>
    );

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
        <ClipboardList className="w-5 h-5 text-primary" />
        Requested Jobs
      </h2>

      {requests.length === 0 ? (
        <p className="text-gray-500">No new job requests yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {requests.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {job.title || "Untitled Request"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {job.property_address || "No address provided"}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                  Requested
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                {job.notes || "No additional notes."}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                📅 {new Date(job.scheduled_date).toLocaleDateString()}
              </p>

              <Button
                onClick={() => setSelectedJob(job)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Assign to Staff
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* 🧩 Modal para asignar staff */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[999]"
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold mb-4">
                Assign Job:{" "}
                <span className="text-blue-600">{selectedJob.title}</span>
              </h3>
              <JobForm
                staffList={staffList}
                getToken={getToken}
                fetchJobs={() => assignToStaff(selectedJob.id)}
              />
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
