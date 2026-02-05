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
import { useAuth } from "@clerk/nextjs";
import { CheckCircle } from "lucide-react";

import { FEATURE_ICONS } from "@/app/(protected)/jobs/components/job-upload/featureIcons";
import { FEATURES } from "@/app/(protected)/jobs/components/job-upload/features";
import { UNIT_TYPE_ICONS } from "@/app/(protected)/jobs/components/job-upload/unitTypeIcons";

export default function JobHeader({
  job,
  router,
  openModal,
  onTitleUpdated,
  onReopen, // ✅ AQUI
  onComplete,
  onStart,
}) {
  const { user } = useUser();

  const role = user?.publicMetadata?.role || "client";
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  const canManageJob = isAdmin || isStaff;
  const { getToken } = useAuth();
  const [editingDuration, setEditingDuration] = useState(false);
  const totalMinutes = Number(job?.duration_minutes);

  const safeMinutes = Number.isFinite(totalMinutes) ? totalMinutes : 0;

  const [hours, setHours] = useState(Math.floor(safeMinutes / 60));
  const [mins, setMins] = useState(safeMinutes % 60);
  const canCompleteJob =
    (isAdmin || isStaff) && ["pending", "in_progress"].includes(job?.status);

  useEffect(() => {
    const m = Number(job?.duration_minutes);
    if (Number.isFinite(m)) {
      setHours(Math.floor(m / 60));
      setMins(m % 60);
    }
  }, [job?.duration_minutes]);

  /* =========================
     REAL-TIME TITLE STATE
  ========================= */
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(job?.title || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(job?.title || "");
  }, [job?.title]);
  async function saveDuration() {
    const minutes = Math.max(0, hours * 60 + mins);

    try {
      const res = await fetch("/api/jobs/save-duration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          minutes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed to update duration");
      }

      setEditingDuration(false);

      // 🔥 fuerza actualización inmediata en UI
      onComplete?.({
        duration_minutes: minutes,
      });
    } catch (err) {
      alert(err.message);
    }
  }

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
        {/* ▶️ START JOB */}
        {isAdmin && job?.status === "pending" && (
          <Button
            size="sm"
            onClick={async () => {
              if (!confirm("Start this job?")) return;

              const res = await fetch(`/api/job-activity/start`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                  jobId: job.id,
                }),
              });

              if (res.ok) {
                onStart?.({
                  status: "in_progress",
                  started_at: new Date().toISOString(),
                });

                openModal(job.id, "before");
              } else {
                console.error("❌ START FAILED");
              }
            }}
          >
            ▶️ Start Job
          </Button>
        )}

        {/* ✅ COMPLETE JOB (pending o in_progress | admin + staff) */}
        {canCompleteJob && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModal(job.id, "after")}
            className="flex items-center gap-2 text-sm"
          >
            <CheckCircle className="w-4 h-4 text-green-600" />
            Complete
          </Button>
        )}

        {/* 🔁 REOPEN JOB (solo cuando está completed) */}
        {isAdmin && job?.status === "completed" && (
          <Button
            size="sm"
            variant="destructive"
            onClick={async () => {
              if (!confirm("Reopen this job?")) return;

              const res = await fetch(`/api/jobs/${job.id}/reopen`, {
                method: "POST",
                credentials: "include",
              });

              if (res.ok) {
                onReopen?.();
              } else {
                console.error("❌ REOPEN FAILED");
              }
            }}
          >
            🔁 Reopen Job
          </Button>
        )}
      </div>

      {/* TITLE */}
      <h1 className="text-2xl font-bold flex items-center gap-3 flex-wrap">
        <ClipboardList className="w-5 h-5 text-primary" />

        <span>{job?.title || "Job"}</span>

        {unitTypeLabel && (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
            <UnitIcon size={14} />
            {unitTypeLabel}
          </span>
        )}
      </h1>

      {/* META ROW — AQUÍ ES DONDE SE VE SIEMPRE */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
        <CalendarDays className="w-4 h-4" />
        <span>{dateLabel}</span>
        <span>•</span>
        <span className="capitalize">{typeLabel}</span>

        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}
        >
          {statusLabel}
        </span>

        {/* ⏱️ DURACIÓN — VISUALMENTE CLARA */}
        {job?.status === "completed" && (
          <div className="ml-2 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold flex items-center gap-2">
            {!editingDuration ? (
              <>
                <span>
                  ⏱️ {hours > 0 ? `${hours} h ` : ""}
                  {mins} min
                </span>

                {isAdmin && (
                  <button
                    onClick={() => setEditingDuration(true)}
                    className="text-xs underline opacity-70 hover:opacity-100"
                  >
                    edit
                  </button>
                )}
              </>
            ) : (
              <>
                <input
                  type="number"
                  min={0}
                  className="w-12 border rounded px-1 text-xs"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value) || 0)}
                />
                h
                <input
                  type="number"
                  min={0}
                  max={59}
                  className="w-12 border rounded px-1 text-xs"
                  value={mins}
                  onChange={(e) => setMins(Number(e.target.value) || 0)}
                />
                min
                <button
                  onClick={saveDuration}
                  className="text-green-700 font-semibold"
                >
                  ✓
                </button>
                <button
                  onClick={() => setEditingDuration(false)}
                  className="text-red-600"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        )}
        {/* ⏱️ LIVE TIMER */}
        {job?.status === "in_progress" && (
          <div className="ml-2 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold flex items-center gap-1">
            <JobTimer jobId={job.id} startedAt={job.started_at} />
          </div>
        )}
      </div>

      {/* FEATURES */}
      {Array.isArray(job?.features) && job.features.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
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
    </motion.div>
  );
}
