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
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function StaffJobsView({
  jobs,
  viewMode,
  setViewMode,
  updateStatus,
}) {
  const { getToken } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [photosByCategory, setPhotosByCategory] = useState({});
  const fileInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 🔹 Categorías (tipo de fotos)
  const categories = [
    { key: "stove", label: "Stove", icon: Flame },
    { key: "oven", label: "Oven", icon: Utensils },
    { key: "fridge", label: "Fridge", icon: Snowflake },
    { key: "range_hood", label: "Range Hood", icon: Wind },
    { key: "sink", label: "Sink", icon: Droplets },
  ];

  // Abrir modal
  const handleStartClick = (jobId) => {
    setCurrentJob(jobId);
    setPhotosByCategory({});
    setModalOpen(true);
  };

  // Seleccionar categoría y abrir file input
  const handleCategoryClick = (catKey) => {
    setSelectedCategory(catKey);
    fileInputRef.current?.click();
  };

  // Subir fotos a Supabase
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedCategory) return;

    setUploading(true);
    try {
      const token = await getToken({ template: "supabase" });
      const supabase = createClient(supabaseUrl, supabaseAnon, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });

      // Obtener user_id de Clerk JWT
      const base64Payload = token.split(".")[1];
      const decoded = JSON.parse(atob(base64Payload));
      const uploadedBy =
        decoded["https://choice-liger-25.supabase.co/jwt/claims"]?.sub_id ||
        "unknown";

      console.log("✅ Uploaded by:", uploadedBy);

      for (const file of files) {
        const path = `${currentJob}/${selectedCategory}/${Date.now()}_${
          file.name
        }`;

        // 📤 Subir al bucket
        const { error: uploadError } = await supabase.storage
          .from("job-photos")
          .upload(path, file);
        if (uploadError) throw uploadError;

        // 🗂️ Registrar en job_photos
        const { error: insertError } = await supabase
          .from("job_photos")
          .insert([
            {
              job_id: currentJob,
              type: "before", // o "after", según el momento
              category: selectedCategory, // stove, oven, etc.
              image_url: path,
              uploaded_by: uploadedBy,
            },
          ]);

        if (insertError) throw insertError;

        // Previsualización local inmediata
        setPhotosByCategory((prev) => ({
          ...prev,
          [selectedCategory]: [
            ...(prev[selectedCategory] || []),
            {
              name: file.name,
              url: `${supabaseUrl}/storage/v1/object/public/job-photos/${path}`,
            },
          ],
        }));
      }

      toast.success(`${files.length} photo(s) uploaded`);
    } catch (err) {
      console.error("❌ Upload error:", err);
      toast.error(err.message || "Error uploading photos");
    } finally {
      setUploading(false);
      e.target.value = "";
      setSelectedCategory(null);
    }
  };

  // Confirmar y pasar a in_progress
  const handleConfirm = async () => {
    const hasPhotos = Object.keys(photosByCategory).length > 0;
    if (!hasPhotos) {
      toast.warning("Please upload at least one photo before starting.");
      return;
    }

    setUploading(true);
    try {
      await updateStatus(currentJob, "in_progress");
      toast.success("Job started!");
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Error updating job status");
    } finally {
      setUploading(false);
      setPhotosByCategory({});
      setCurrentJob(null);
    }
  };

  return (
    <main className="px-6 py-10 max-w-[1600px] mx-auto space-y-10">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🧽 My Jobs
        </h1>
      </div>

      {/* MODAL */}
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

              <h2 className="text-xl font-semibold mb-4">
                Upload Photos Before Starting
              </h2>

              {/* CATEGORÍAS CON IMÁGENES DEBAJO */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mb-6">
                {categories.map(({ key, label, icon: Icon }) => (
                  <div
                    key={key}
                    className="flex flex-col items-center justify-start space-y-3"
                  >
                    {/* Botón de categoría */}
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

                    {/* Imágenes uniformes debajo (versión cuadrada 1:1) */}
                    {photosByCategory[key]?.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2 w-28">
                        {photosByCategory[key].map((f, i) => (
                          <div
                            key={i}
                            className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 shadow-sm overflow-hidden flex items-center justify-center"
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

              {/* INPUT OCULTO */}
              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                onChange={handleUpload}
                className="hidden"
              />

              {/* BOTÓN CONFIRMAR */}
              <Button
                className="w-full mt-4"
                onClick={handleConfirm}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Confirm & Start Job"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* JOBS LIST / GRID */}
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
                  className="border-t hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => (window.location.href = `/jobs/${job.id}`)} // ✅ navegación directa
                >
                  <td className="px-4 py-2 font-medium">{job.title}</td>
                  <td className="px-4 py-2">
                    {new Date(job.scheduled_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{job.service_type}</td>
                  <td className="px-4 py-2">
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
                  </td>
                  <td
                    className="px-4 py-2 text-right space-x-2"
                    onClick={(e) => e.stopPropagation()} // ✅ evita que los botones naveguen
                  >
                    {job.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleStartClick(job.id)}
                      >
                        Start
                      </Button>
                    )}
                    {job.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(job.id, "completed")}
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
              <Card className="hover:shadow-lg border border-border/50 relative transition-transform hover:scale-[1.02]">
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

                    {/* ⚙️ Botones siguen activos, sin interferir con el click del Card */}
                    <div onClick={(e) => e.stopPropagation()}>
                      {job.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleStartClick(job.id)}
                        >
                          Start
                        </Button>
                      )}
                      {job.status === "in_progress" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(job.id, "completed")}
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
}
