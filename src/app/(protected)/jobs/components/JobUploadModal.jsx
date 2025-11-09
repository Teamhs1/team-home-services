"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Flame, Utensils, Snowflake, Wind, Droplets } from "lucide-react";
import { toast } from "sonner";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function JobUploadModal({
  jobId,
  type,
  onClose,
  updateStatus,
  fetchJobs,
}) {
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

  const handleCategoryClick = (key) => {
    setSelectedCategory(key);
    fileInputRef.current?.click();
  };

  // 🔼 Subida de fotos
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedCategory) return;

    setUploading(true);
    try {
      const token = await window.Clerk?.session?.getToken({
        template: "supabase",
      });
      if (!token) throw new Error("No se obtuvo token Clerk");

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
        const path = `${jobId}/${type}/${selectedCategory}/${Date.now()}_${
          file.name
        }`;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", path);
        formData.append("job_id", jobId);
        formData.append("category", selectedCategory);

        const res = await fetch("/api/job-photos/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/job-photos/${path}`;
        setPhotosByCategory((prev) => ({
          ...prev,
          [selectedCategory]: prev[selectedCategory].map((f) =>
            f.name === file.name ? { name: file.name, url: publicUrl } : f
          ),
        }));
      }

      toast.success(`${files.length} ${type} photo(s) uploaded successfully!`);
    } catch (err) {
      console.error("❌ Upload error:", err);
      toast.error(err.message || "Error uploading");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ✅ Confirmar inicio o finalización del trabajo
  const handleConfirm = async () => {
    if (!Object.keys(photosByCategory).length) {
      toast.warning("Please upload at least one photo.");
      return;
    }

    setUploading(true);
    try {
      const newStatus = type === "before" ? "in_progress" : "completed";
      await updateStatus(jobId, newStatus);

      await fetch("/api/job-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          action: type === "before" ? "start" : "complete",
          notes: type === "before" ? "Job started" : "Job completed",
        }),
      });

      if (type === "after") {
        const stopRes = await fetch("/api/job-activity/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: jobId }),
        });
        const stopData = await stopRes.json();
        if (!stopRes.ok) throw new Error(stopData.error || "Stop failed");

        toast.success(`Job completed in ${stopData.durationMinutes} minutes`);
      } else {
        toast.success("Job started!");
      }

      await fetchJobs?.();
      onClose();
    } catch (err) {
      console.error("❌ Error in handleConfirm:", err);
      toast.error(err.message || "Error updating job status");
    } finally {
      setUploading(false);
      setPhotosByCategory({});
    }
  };

  return (
    <AnimatePresence>
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
            onClick={onClose}
          >
            <X size={22} />
          </button>

          <h2 className="text-xl font-semibold mb-4 text-center">
            {type === "before"
              ? "Upload Photos Before Starting"
              : "Upload Photos After Completing"}
          </h2>

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
            onChange={handleUpload}
            className="hidden"
          />

          <Button
            className="w-full mt-4"
            onClick={handleConfirm}
            disabled={uploading}
          >
            {uploading
              ? "Uploading..."
              : type === "before"
              ? "Confirm & Start Job"
              : "Confirm & Complete Job"}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
