"use client";

import { ArrowLeft, CalendarDays, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import JobTimer from "../../components/JobTimer";
import JobDuration from "../../components/JobDuration";
import { useUser } from "@clerk/nextjs";

export default function JobHeader({ job, router, openModal }) {
  const { user } = useUser();
  const role = user?.publicMetadata?.role || "client";

  const dateLabel = job?.scheduled_date
    ? new Date(job.scheduled_date).toLocaleDateString()
    : "Sin fecha";

  const typeLabel = job?.service_type || "Sin tipo";

  const statusLabel = job?.status?.replace("_", " ") || "N/A";

  const statusColor =
    job?.status === "pending"
      ? "bg-yellow-100 text-yellow-700"
      : job?.status === "in_progress"
      ? "bg-blue-100 text-blue-700"
      : job?.status === "completed"
      ? "bg-green-100 text-green-700"
      : "bg-gray-200 text-gray-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        w-full mb-10
        flex items-center justify-between
        flex-wrap gap-4
      "
    >
      {/* IZQUIERDA */}
      <div className="flex items-center">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      </div>

      {/* CENTRO */}
      <div className="flex flex-col text-center md:text-left md:flex-row md:items-center md:gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          {job?.title || "Nuevo trabajo"}
        </h1>

        <div className="text-sm flex items-center gap-2 text-gray-600">
          <CalendarDays className="w-4 h-4" />
          {dateLabel} • <span className="capitalize">{typeLabel}</span> •
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* DERECHA */}
      {role !== "client" && (
        <div className="flex items-center gap-3">
          {job?.status === "pending" && (
            <Button
              size="sm"
              className="shadow-md"
              onClick={() => openModal(job.id, "before")}
            >
              Start Job
            </Button>
          )}

          {job?.status === "in_progress" && (
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

          {job?.status === "completed" && (
            <div className="bg-green-50 text-green-700 text-sm font-semibold px-3 py-1.5 rounded-lg shadow-sm">
              <JobDuration jobId={job.id} />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
