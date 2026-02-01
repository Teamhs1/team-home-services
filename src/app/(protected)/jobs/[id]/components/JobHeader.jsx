"use client";

import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Plus,
  Home,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import JobTimer from "../../components/JobTimer";
import JobDuration from "../../components/JobDuration";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

import { FEATURE_ICONS } from "@/app/(protected)/jobs/components/job-upload/featureIcons";
import { FEATURES } from "@/app/(protected)/jobs/components/job-upload/features";
import { UNIT_TYPE_ICONS } from "@/app/(protected)/jobs/components/job-upload/unitTypeIcons";

export default function JobHeader({ job, router, openModal, onTitleUpdated }) {
  const { user } = useUser();

  const role = user?.publicMetadata?.role || "client";
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  const canManageJob = isAdmin || isStaff;

  /* =========================
     REAL-TIME TITLE STATE
  ========================= */
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(job?.title || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(job?.title || "");
  }, [job?.title]);

  async function saveTitle() {
    if (!title.trim() || title === job.title) {
      setEditingTitle(false);
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) throw new Error("Failed to update title");

      // 🔥 AQUÍ MISMO (después del PATCH exitoso)
      onTitleUpdated?.(title);
    } catch (err) {
      console.error(err);
      setTitle(job.title); // rollback
    } finally {
      setSaving(false);
      setEditingTitle(false);
    }
  }

  /* ========================= */

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

  const UnitIcon = (job?.unit_type && UNIT_TYPE_ICONS[job.unit_type]) || Home;

  const unitTypeLabel = job?.unit_type
    ? job.unit_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mb-10 flex flex-col gap-4"
    >
      {/* TOP BAR */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>

        {canManageJob && (
          <div className="flex items-center gap-3">
            {job?.status === "pending" && (
              <Button size="sm" onClick={() => openModal(job.id, "before")}>
                Start Job
              </Button>
            )}

            {job?.status === "in_progress" && (
              <>
                <div className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-lg">
                  <JobTimer jobId={job.id} />
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openModal(job.id, "after")}
                >
                  Complete Job
                </Button>
              </>
            )}

            {job?.status === "completed" && (
              <>
                <div className="bg-green-50 text-green-700 text-sm font-semibold px-3 py-1.5 rounded-lg">
                  <JobDuration jobId={job.id} />
                </div>

                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => openModal(job.id, "after")}
                  >
                    <Plus className="w-4 h-4" />
                    Add Photos
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* TITLE + META */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-3 flex-wrap">
          <ClipboardList className="w-5 h-5 text-primary" />

          {editingTitle && canManageJob ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === "Enter" && saveTitle()}
              className="border-b border-primary bg-transparent focus:outline-none font-bold text-2xl"
            />
          ) : (
            <span
              onClick={() => canManageJob && setEditingTitle(true)}
              className={`cursor-pointer ${
                canManageJob ? "hover:text-primary" : ""
              }`}
              title={canManageJob ? "Click para editar" : ""}
            >
              {editingTitle ? title : job?.title || "Job"}
              {saving && (
                <span className="ml-2 text-xs text-gray-400">guardando...</span>
              )}
            </span>
          )}

          {/* UNIT TYPE */}
          {unitTypeLabel && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
              <UnitIcon size={14} />
              {unitTypeLabel}
            </span>
          )}
        </h1>

        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <CalendarDays className="w-4 h-4" />
          {dateLabel} • <span className="capitalize">{typeLabel}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>

        {/* FEATURES */}
        {Array.isArray(job?.features) && job.features.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {job.features.map((key) => {
              const Icon = FEATURE_ICONS[key];
              const label =
                FEATURES.find((f) => f.key === key)?.label ||
                key.replaceAll("_", " ");

              return (
                <span
                  key={key}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                >
                  {Icon && <Icon size={14} />}
                  {label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
