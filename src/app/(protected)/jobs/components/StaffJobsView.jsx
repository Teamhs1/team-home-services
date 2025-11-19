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
import { useRouter } from "next/navigation";

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

  const router = useRouter();

  // ⭐ AUTO-FORZAR GRID EN MÓVIL (UX recomendado)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setViewMode("grid"); // sm breakpoint
    }
  }, []);

  const openModal = (jobId, type) => {
    setModalType(type);
    setCurrentJob(jobId);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentJob(null);
    setModalType(null);
  };

  const updateLocalJob = (jobId, updates) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j))
    );
  };

  // ⭐ REALTIME
  useEffect(() => {
    const supabaseRealtime = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const channel = supabaseRealtime
      .channel("staff_jobs_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleaning_jobs" },
        async () => {
          await fetchJobs?.();
          toast.info("🔄 Job list updated in real-time");
        }
      )
      .subscribe();

    return () => supabaseRealtime.removeChannel(channel);
  }, [fetchJobs]);

  const ViewToggleButton = () => (
    <div className="hidden sm:flex justify-end mb-6">
      {/* 🔥 Toggle solo aparece en desktop/tablet */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
        className="flex items-center gap-2"
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
    <main className="px-4 py-6 sm:px-6 sm:py-10 max-w-[1600px] mx-auto space-y-10">
      {/* 🔹 Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
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

      {/* LISTA / GRID */}
      {viewMode === "list" ? (
        <JobList jobs={jobs} openModal={openModal} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => router.push(`/jobs/${job.id}`)}
              className="cursor-pointer bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between"
            >
              {/* Top */}
              <div>
                <h3 className="font-semibold text-lg text-gray-900 leading-snug">
                  {job.title}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {job.service_type} •{" "}
                  {job.scheduled_date
                    ? new Date(job.scheduled_date).toLocaleDateString()
                    : "No date"}
                </p>

                {/* Status + Timers */}
                <div className="mt-3 space-y-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold inline-block w-fit
                    ${
                      job.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : job.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {job.status.replace("_", " ")}
                  </span>

                  {job.status === "in_progress" && (
                    <div className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-2 rounded-lg shadow-sm w-fit">
                      <JobTimer jobId={job.id} />
                    </div>
                  )}

                  {job.status === "completed" && (
                    <div className="bg-green-50 text-green-700 text-sm font-semibold px-3 py-2 rounded-lg shadow-sm w-fit">
                      <JobDuration jobId={job.id} />
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-4 text-right">
                {job.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // ⭐ evita redirect
                      openModal(job.id, "before");
                    }}
                  >
                    Start
                  </Button>
                )}

                {job.status === "in_progress" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(job.id, "after");
                    }}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
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
