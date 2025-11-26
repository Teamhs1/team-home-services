"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ClipboardList, LayoutGrid, List, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { JobList } from "./JobList";
import { JobUploadModal } from "./JobUploadModal";
import JobTimer from "./JobTimer";
import JobDuration from "./JobDuration";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import Slider from "@/components/Slider";

// NECESARIO PARA LAS TARJETAS
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

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
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  // ⭐ AUTO-FORZAR GRID EN MÓVIL
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setViewMode("grid");
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

  // ⭐ FILTRO DE JOBS DESDE QUERY PARAM
  const filteredJobs =
    statusFilter === "all"
      ? jobs
      : statusFilter === "upcoming"
      ? jobs.filter((j) => new Date(j.scheduled_date) > new Date())
      : jobs.filter((j) => j.status === statusFilter);

  // ⭐ BOTÓN GRID / LIST
  const ViewToggleButton = () => (
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
  );

  return (
    <main className="py-6 sm:px-6 sm:py-10 max-w-[1600px] mx-auto space-y-10">
      {/* 🔹 Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          My Jobs
        </h1>

        <div className="flex items-center gap-3">
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

      {/* LIST / GRID */}
      {/* LIST / GRID */}
      {viewMode === "list" ? (
        <JobList jobs={filteredJobs} openModal={openModal} />
      ) : (
        <div
          className="
      grid 
      gap-4 sm:gap-6 
      place-items-center   /* 💥 CENTRAR LAS CARDS */

      grid-cols-1     
      sm:grid-cols-1  
      md:grid-cols-2  
      lg:grid-cols-3 
      xl:grid-cols-4
    "
        >
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              className="
          relative border shadow-sm hover:shadow-md transition-all 
          rounded-2xl bg-white overflow-hidden

          w-[90%]    /* 💥 90% DEL ANCHO EN MÓVIL */
          sm:w-[90%] /* 💥 un poco más ancho en sm */
          md:w-full  /* 💥 FULL cuando ya son 2 columnas */
          mx-auto
        "
            >
              {/* Imagen */}
              <div
                className="cursor-pointer relative aspect-video bg-gray-100"
                onClick={() => router.push(`/jobs/${job.id}`)}
              >
                <Slider jobId={job.id} mini />

                {/* Cantidad de fotos */}
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  {job.photo_count || 0} photos
                </div>

                {/* Estado */}
                <span
                  className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm
              ${
                job.status === "pending"
                  ? "bg-yellow-300/70 text-black"
                  : job.status === "in_progress"
                  ? "bg-blue-500/70 text-white"
                  : "bg-green-500/70 text-white"
              }`}
                >
                  {job.status.replace("_", " ")}
                </span>
              </div>

              {/* Contenido */}
              <CardHeader className="pb-1">
                <CardTitle className="text-lg font-semibold truncate">
                  {job.title}
                </CardTitle>

                <CardDescription className="flex items-center gap-2 text-xs text-gray-500">
                  <CalendarDays className="w-3 h-3" />
                  {job.scheduled_date || "No date"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-1">
                {/* Tipo */}
                <p className="text-sm capitalize text-gray-700">
                  <strong className="text-gray-800">Type:</strong>{" "}
                  {job.service_type}
                </p>

                {/* Timer / duration */}
                <div>
                  {job.status === "in_progress" && (
                    <div className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      <JobTimer jobId={job.id} />
                    </div>
                  )}

                  {job.status === "completed" && (
                    <div className="flex flex-col text-xs text-green-700 gap-0.5">
                      <div className="inline-block bg-green-50 px-3 py-1 font-semibold rounded-full shadow-sm">
                        <JobDuration jobId={job.id} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="pt-1 flex justify-end">
                  {job.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
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
              </CardContent>
            </Card>
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
