"use client";

import React, { useState, useRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  CalendarDays,
  X,
  Flame,
  Utensils,
  Snowflake,
  Wind,
  Droplets,
} from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function StaffJobsView({
  jobs,
  viewMode,
  setViewMode,
  updateStatus,
}) {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const clerkId = user?.id || null;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("before");
  const [currentJob, setCurrentJob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [photosByCategory, setPhotosByCategory] = useState({});
  const fileInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    { key: "stove", label: "Stove", icon: Flame },
    { key: "oven", label: "Oven", icon: Utensils },
    { key: "fridge", label: "Fridge", icon: Snowflake },
    { key: "range_hood", label: "Range Hood", icon: Wind },
    { key: "sink", label: "Sink", icon: Droplets },
  ];

  const openModal = (jobId, type) => {
    setModalType(type);
    setCurrentJob(jobId);
    setPhotosByCategory({});
    setModalOpen(true);
  };

  const handleCategoryClick = (key) => {
    setSelectedCategory(key);
    fileInputRef.current?.click();
  };

  // ✅ Subir fotos autenticado con Clerk (token firmado desde template)
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedCategory) return;

    setUploading(true);
    try {
      // 🔑 Usa el token firmado de plantilla “supabase”
      const token = await window.Clerk?.session?.getToken({
        template: "supabase",
      });

      if (!token) throw new Error("No se obtuvo token de Clerk (supabase)");
      console.log("🪪 Clerk token obtenido:", token.slice(0, 30), "...");

      for (const file of files) {
        const path = `${currentJob}/${modalType}/${selectedCategory}/${Date.now()}_${
          file.name
        }`;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", path);
        formData.append("job_id", currentJob);
        formData.append("category", selectedCategory);

        const res = await fetch("/api/job-photos/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const text = await res.text();
        console.log("📩 Raw backend response:", text);

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: "Invalid JSON response" };
        }

        if (!res.ok) {
          console.error("🚫 Upload failed:", res.status, data);
          throw new Error(data.error || "Upload failed");
        }

        console.log("✅ Upload done:", data.photo);
      }

      toast.success(
        `${files.length} ${modalType} photo(s) uploaded successfully!`
      );
    } catch (err) {
      console.error("❌ Upload error:", err);
      toast.error(err.message || "Unauthorized");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleConfirm = async () => {
    if (!Object.keys(photosByCategory).length) {
      toast.warning("Please upload at least one photo.");
      return;
    }

    setUploading(true);
    try {
      // ✅ 1. Determinar nuevo estado
      const newStatus = modalType === "before" ? "in_progress" : "completed";
      await updateStatus(currentJob, newStatus);

      // ✅ 2. Insertar actividad
      await fetch("/api/job-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: currentJob,
          staff_id: clerkId,
          action: modalType === "before" ? "start" : "complete",
          notes:
            modalType === "before"
              ? "Job started by staff member"
              : "Job completed by staff member",
        }),
      });

      // ✅ 3. Si se completó, registra el stop (guarda duración en cleaning_jobs)
      if (modalType === "after") {
        const stopRes = await fetch("/api/job-activity/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: currentJob,
            staff_id: clerkId,
          }),
        });

        const stopData = await stopRes.json();
        if (!stopRes.ok) throw new Error(stopData.error || "Stop failed");

        console.log("🕒 Duración guardada:", stopData);
        toast.success(`Job completed in ${stopData.durationMinutes} minutes`);
      } else {
        toast.success("Job started!");
      }

      // ✅ 4. Refresca lista
      if (typeof fetchJobs === "function") {
        await fetchJobs();
      } else {
        // 🕐 Si no se recarga la lista, actualiza manualmente el estado del job actual
        setCurrentJob(null);
        setModalOpen(false);
      }

      // 🔄 Fuerza re-render local para ver el contador sin refrescar
      setTimeout(() => {
        const updated = jobs.map((job) =>
          job.id === currentJob ? { ...job, status: "in_progress" } : job
        );
        setViewMode((prev) => prev); // mantiene la vista
      }, 300);
    } catch (err) {
      console.error("❌ Error en handleConfirm:", err);
      toast.error(err.message || "Error updating job status");
    } finally {
      setUploading(false);
      setPhotosByCategory({});
      setCurrentJob(null);
    }
  };

  return (
    <main className="px-6 py-10 max-w-[1600px] mx-auto space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🧽 My Jobs
        </h1>
      </div>

      {/* 🔹 MODAL UPLOAD */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl p-8 relative"
            >
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                onClick={() => setModalOpen(false)}
              >
                <X size={22} />
              </button>

              <h2 className="text-xl font-semibold mb-4 text-center">
                {modalType === "before"
                  ? "Upload Photos Before Starting"
                  : "Upload Photos After Completing"}
              </h2>

              {/* CATEGORIES */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mb-6">
                {categories.map(({ key, label, icon: Icon }) => (
                  <div
                    key={key}
                    className="flex flex-col items-center justify-start space-y-3"
                  >
                    <button
                      onClick={() => handleCategoryClick(key)}
                      className="flex flex-col items-center justify-center w-28 h-28 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition relative shadow-sm"
                    >
                      <Icon className="w-6 h-6 text-primary mb-1" />
                      <span className="text-sm font-medium">{label}</span>
                      {photosByCategory[key]?.length > 0 && (
                        <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {photosByCategory[key].length}
                        </span>
                      )}
                    </button>

                    {/* 👇 VISTA PREVIA DE LAS FOTOS SUBIDAS */}
                    {photosByCategory[key]?.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2 w-28">
                        {photosByCategory[key].map((f, i) => (
                          <div
                            key={i}
                            className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 shadow-sm overflow-hidden"
                          >
                            <img
                              src={f.url}
                              alt={f.name}
                              className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                onChange={async (e) => {
                  const files = Array.from(e.target.files);
                  if (!files.length || !selectedCategory) return;

                  setUploading(true);
                  try {
                    const token = await window.Clerk?.session?.getToken({
                      template: "supabase",
                    });
                    if (!token) throw new Error("No se obtuvo token Clerk");

                    // 👇 Muestra previews locales antes de subir
                    const localPreviews = files.map((file) => ({
                      name: file.name,
                      url: URL.createObjectURL(file),
                      pending: true,
                    }));

                    setPhotosByCategory((prev) => ({
                      ...prev,
                      [selectedCategory]: [
                        ...(prev[selectedCategory] || []),
                        ...localPreviews,
                      ],
                    }));

                    for (const file of files) {
                      const path = `${currentJob}/${modalType}/${selectedCategory}/${Date.now()}_${
                        file.name
                      }`;
                      const formData = new FormData();
                      formData.append("file", file);
                      formData.append("path", path);
                      formData.append("job_id", currentJob);
                      formData.append("category", selectedCategory);

                      const res = await fetch("/api/job-photos/upload", {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                        body: formData,
                      });

                      const data = await res.json();
                      if (!res.ok)
                        throw new Error(data.error || "Upload failed");

                      // 🔗 Reemplaza preview local por la URL real
                      const publicUrl = `${supabaseUrl}/storage/v1/object/public/job-photos/${path}`;

                      setPhotosByCategory((prev) => ({
                        ...prev,
                        [selectedCategory]: prev[selectedCategory].map((f) =>
                          f.name === file.name
                            ? { name: file.name, url: publicUrl }
                            : f
                        ),
                      }));
                    }

                    toast.success(
                      `Fotos ${selectedCategory} subidas correctamente`
                    );
                  } catch (err) {
                    toast.error(err.message);
                  } finally {
                    setUploading(false);
                    e.target.value = "";
                  }
                }}
                className="hidden"
              />

              <Button
                className="w-full mt-4"
                onClick={handleConfirm}
                disabled={uploading}
              >
                {uploading
                  ? "Uploading..."
                  : modalType === "before"
                  ? "Confirm & Start Job"
                  : "Confirm & Complete Job"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ JOB LIST */}
      {viewMode === "list" ? (
        <div className="overflow-x-auto bg-white shadow rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Job</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => (window.location.href = `/jobs/${job.id}`)}
                >
                  <td className="px-4 py-2 font-medium">{job.title}</td>
                  <td className="px-4 py-2">
                    {new Date(job.scheduled_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{job.service_type}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col items-start gap-1">
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

                      {/* ⏱️ Contador en tiempo real */}
                      {job.status === "in_progress" && (
                        <JobTimer jobId={job.id} status={job.status} />
                      )}

                      {/* 🕒 Duración final al completar (desde cleaning_jobs) */}
                      {job.status === "completed" && (
                        <div className="mt-1 text-xs font-semibold text-green-600 flex items-center gap-1">
                          🕒{" "}
                          {job.duration_minutes
                            ? job.duration_minutes >= 60
                              ? `${Math.floor(job.duration_minutes / 60)}h ${
                                  job.duration_minutes % 60
                                }m total`
                              : `${job.duration_minutes}m total`
                            : "—"}
                        </div>
                      )}
                    </div>
                  </td>

                  <td
                    className="px-4 py-2 text-right space-x-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {job.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => openModal(job.id, "before")}
                      >
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
              <Card className="hover:shadow-lg border border-border/50 transition-transform hover:scale-[1.02]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    {job.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    <CalendarDays className="w-4 h-4 inline mr-1" />
                    {job.scheduled_date} • {job.service_type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mt-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        job.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : job.status === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {job.status.replace("_", " ")}
                    </span>
                    <div onClick={(e) => e.stopPropagation()}>
                      {job.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => openModal(job.id, "before")}
                        >
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
} // 👈 aquí termina StaffJobsView

/* ✅ Componente contador de duración del job */
function JobTimer({ jobId, status }) {
  const [elapsed, setElapsed] = React.useState(0);
  const [startTime, setStartTime] = React.useState(null);

  // 🕐 Obtiene la última hora de inicio del job
  React.useEffect(() => {
    if (!jobId || status !== "in_progress") return;

    (async () => {
      try {
        const res = await fetch(`/api/job-activity/last-start?job_id=${jobId}`);
        const data = await res.json();
        if (data.startTime) setStartTime(new Date(data.startTime));
      } catch (err) {
        console.error("Error fetching start time:", err);
      }
    })();
  }, [jobId, status]);

  // 🔁 Actualiza cada segundo
  React.useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsed(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime || status !== "in_progress") return null;

  const hours = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="mt-1 text-xs font-semibold text-blue-600 flex items-center gap-1">
      ⏱️ {hours}:{minutes}:{seconds}
    </div>
  );
}

/* ✅ Componente que muestra la duración final del job */
function JobDuration({ jobId, status }) {
  const [duration, setDuration] = React.useState(null);

  React.useEffect(() => {
    if (!jobId || status !== "completed") return;

    (async () => {
      try {
        const res = await fetch(
          `/api/job-activity/last-duration?job_id=${jobId}`
        );
        const data = await res.json();
        if (data?.duration) setDuration(data.duration);
      } catch (err) {
        console.error("Error fetching duration:", err);
      }
    })();
  }, [jobId, status]);

  if (!duration || status !== "completed") return null;

  const totalMinutes = Math.floor(duration / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="mt-1 text-xs font-semibold text-green-600 flex items-center gap-1">
      🕒 {hours > 0 ? `${hours}h ` : ""}
      {minutes}min total
    </div>
  );
}
