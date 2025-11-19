"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ClipboardList, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { JobList } from "./JobList";
import { JobUploadModal } from "./JobUploadModal";
import JobTimer from "./JobTimer";
import JobDuration from "./JobDuration";
import { createClient } from "@supabase/supabase-js";

export default function StaffJobsView({
  jobs: initialJobs,
  updateStatus,
  fetchJobs,
  viewMode,
  setViewMode,
}) {
  const [jobs, setJobs] = useState(initialJobs || []);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);

  // 🧩 Abrir modal (before / after)
  const openModal = (jobId, type) => {
    setModalType(type);
    setCurrentJob(jobId);
    setModalOpen(true);
  };

  // ✅ Cerrar modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentJob(null);
    setModalType(null);
  };

  // ✅ Actualiza un job localmente (para reflejar cambios sin recargar)
  const updateLocalJob = (jobId, updates) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j))
    );
  };

  // ✅ Realtime: actualizaciones automáticas
  useEffect(() => {
    const supabaseRealtime = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const channel = supabaseRealtime
      .channel("staff_jobs_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cleaning_jobs",
        },
        async (payload) => {
          console.log("📡 Staff Realtime event:", payload.eventType);
          await fetchJobs?.();
          toast.info("🔄 Job list updated in real-time");
        }
      )
      .subscribe((status) => {
        console.log("📶 Staff Realtime channel status:", status);
      });

    return () => {
      console.log("❌ Unsubscribed from staff realtime");
      supabaseRealtime.removeChannel(channel);
    };
  }, [fetchJobs]);

  // 🔘 Botón de cambio de vista (grid / list)
  const ViewToggleButton = () => (
    <div className="flex justify-end mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
        className="flex items-center gap-2"
        title={`Switch to ${viewMode === "grid" ? "List" : "Grid"} View`}
      >
        {viewMode === "grid" ? (
          <List className="w-4 h-4" />
        ) : (
          <LayoutGrid className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  return (
    <main className="px-6 py-10 max-w-[1600px] mx-auto space-y-10">
      {/* 🧽 Encabezado */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          My Jobs
        </h1>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchJobs?.();
              toast.info("Refreshing jobs list...");
            }}
          >
            Refresh
          </Button>
          <ViewToggleButton />
        </div>
      </div>

      {/* 🧾 Vista según modo */}
      {viewMode === "list" ? (
        <JobList jobs={jobs} openModal={openModal} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col justify-between"
            >
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {job.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {job.service_type} •{" "}
                  {job.scheduled_date
                    ? new Date(job.scheduled_date).toLocaleDateString()
                    : "No date"}
                </p>

                <div className="mt-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      job.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : job.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {job.status.replace("_", " ")}
                  </span>

                  {job.status === "in_progress" && <JobTimer jobId={job.id} />}
                  {job.status === "completed" && <JobDuration jobId={job.id} />}
                </div>
              </div>

              <div className="mt-4 text-right">
                {job.status === "pending" && (
                  <Button size="sm" onClick={() => openModal(job.id, "before")}>
                    Start
                  </Button>
                )}
                {job.status === "in_progress" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openModal(job.id, "after")}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📸 Modal de fotos y confirmación */}
      <AnimatePresence>
        {modalOpen && currentJob && (
          <JobUploadModal
            key={currentJob}
            jobId={currentJob}
            type={modalType}
            onClose={handleCloseModal}
            updateStatus={updateStatus}
            fetchJobs={fetchJobs}
            updateLocalJob={updateLocalJob}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
