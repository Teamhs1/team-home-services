"use client";

import { ArrowLeft, CalendarDays, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import JobTimer from "../../components/JobTimer";
import JobDuration from "../../components/JobDuration";

export default function JobHeader({ job, router, openModal }) {
  const backLabel = "Volver";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-4 flex-wrap gap-3"
    >
      {/* VOLVER */}
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Button>

      {/* INFO DEL JOB */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-gray-700">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          {job?.title}
        </h1>

        <div className="text-sm flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          {new Date(job.scheduled_date).toLocaleDateString()} •{" "}
          <span className="capitalize">{job.service_type}</span> •{" "}
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              job.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : job.status === "in_progress"
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {job.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* ACCIONES DEL JOB */}
      <div className="flex items-center gap-3 mt-6 z-[20] relative">
        {/* START JOB */}
        {job.status === "pending" && (
          <Button
            size="sm"
            className="shadow-md"
            onClick={async () => {
              await fetch(`/api/jobs/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ job_id: job.id }),
              });
              router.refresh();
            }}
          >
            Start Job
          </Button>
        )}

        {/* JOB EN PROGRESO */}
        {job.status === "in_progress" && (
          <>
            <div className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-lg shadow-sm">
              <JobTimer jobId={job.id} />
            </div>

            <Button
              size="sm"
              variant="outline"
              className="shadow-sm"
              onClick={() => openModal(job.id, "after")}
            >
              Complete Job
            </Button>
          </>
        )}

        {/* JOB COMPLETADO */}
        {job.status === "completed" && (
          <div className="bg-green-50 text-green-700 text-sm font-semibold px-3 py-1.5 rounded-lg shadow-sm">
            <JobDuration jobId={job.id} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
