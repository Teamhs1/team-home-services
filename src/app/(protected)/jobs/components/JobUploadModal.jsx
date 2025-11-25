"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  X,
  Flame,
  ChefHat,
  IceCream,
  Snowflake,
  ShowerHead,
  BedSingle,
  Armchair,
  UtensilsCrossed,
  Toilet,
  Bath,
  Droplet,
} from "lucide-react";

import { Oven } from "lucide-react";

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

  // =============================
  // CATEGORÍAS ORGANIZADAS 🔥
  // =============================
  const compareCategories = [
    { key: "stove", label: "Stove", icon: Flame },
    { key: "stove_back", label: "Behind Stove", icon: ChefHat },

    { key: "fridge", label: "Fridge", icon: IceCream },
    { key: "fridge_back", label: "Behind Fridge", icon: Snowflake },

    { key: "toilet", label: "Toilet", icon: Toilet },
    { key: "bathtub", label: "Bathtub", icon: Bath },
    { key: "sink", label: "Sink", icon: Droplet },
  ];

  const generalCategories = [
    { key: "kitchen", label: "Kitchen", icon: UtensilsCrossed },
    { key: "bathroom", label: "Bathroom", icon: ShowerHead },
    { key: "bedroom", label: "Bedroom", icon: BedSingle },
    { key: "living_room", label: "Living Room", icon: Armchair },
  ];

  const handleCategoryClick = (key) => {
    setSelectedCategory(key);
    fileInputRef.current?.click();
  };

  // =============================
  // Upload (ACTUALIZADO)
  // =============================
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedCategory) return;

    setUploading(true);

    try {
      const token = await window.Clerk?.session?.getToken({
        template: "supabase",
      });

      if (!token) throw new Error("No se obtuvo token Clerk");

      const previews = files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        pending: true,
      }));

      setPhotosByCategory((prev) => ({
        ...prev,
        [selectedCategory]: [...(prev[selectedCategory] || []), ...previews],
      }));

      // Detectar si es categoría general
      const isGeneral = generalCategories
        .map((c) => c.key)
        .includes(selectedCategory);

      // ⛔ No permitir generales en BEFORE
      if (isGeneral && type === "before") {
        toast.error(
          "General photos can only be uploaded AFTER completing the job."
        );
        setUploading(false);
        e.target.value = "";
        return;
      }

      // ✔ General areas siempre van como "after" (no comparador)
      const folderType = isGeneral ? "after" : type;

      for (const file of files) {
        const path = `${jobId}/${folderType}/${selectedCategory}/${Date.now()}_${
          file.name
        }`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", path);
        formData.append("job_id", jobId);
        formData.append("category", selectedCategory);
        formData.append("type", folderType); // 🔥 SE AGREGA PARA EL BACKEND

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

      toast.success(`${files.length} photo(s) uploaded!`);
    } catch (err) {
      toast.error(err.message || "Error uploading");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // =============================
  // Confirm
  // =============================
  const handleConfirm = async () => {
    if (!Object.keys(photosByCategory).length) {
      toast.warning("Please upload at least one photo.");
      return;
    }

    setUploading(true);

    try {
      const newStatus = type === "before" ? "in_progress" : "completed";

      // 🔥 Si es AFTER, guardar la fecha de completado
      if (type === "after") {
        const { error } = await fetch("/api/job-activity/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: jobId }),
        }).then((r) => r.json());

        await updateStatus(jobId, "completed");

        // 🚀 Guardar completed_at en Supabase
        const { error: dateError } = await fetch(
          "/api/jobs/set-completed-date",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              job_id: jobId,
              completed_at: new Date().toISOString(),
            }),
          }
        );

        if (dateError) throw new Error("Failed to save completion date");
      } else {
        await updateStatus(jobId, "in_progress");

        await fetch("/api/job-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: jobId,
            action: "start",
            notes: "Job started",
          }),
        });
      }

      toast.success(type === "after" ? "Job completed!" : "Job started!");

      await fetchJobs?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      setPhotosByCategory({});
    }
  };

  // =============================
  // RENDER
  // =============================
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          className="
  bg-white dark:bg-gray-900 
  rounded-2xl shadow-xl 
  w-full max-w-3xl p-6 relative
  max-h-[90vh] overflow-y-auto
"
        >
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <X size={22} />
          </button>

          <h2 className="text-xl font-bold mb-6 text-center">
            {type === "before"
              ? "Upload Photos Before Starting"
              : "Upload Photos After Completing"}
          </h2>

          {/* ============================= */}
          {/* COMPARE SECTION */}
          {/* ============================= */}
          <h3 className="text-lg font-semibold mb-3">
            Compare Photos (Before / After)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-10">
            {compareCategories.map(({ key, label, icon: Icon }) => (
              <CategoryBlock
                key={key}
                icon={Icon}
                label={label}
                categoryKey={key}
                photos={photosByCategory[key]}
                onClick={() => handleCategoryClick(key)}
              />
            ))}
          </div>

          {/* ============================= */}
          {/* GENERAL AREAS ONLY FOR AFTER */}
          {/* ============================= */}
          {type === "after" && (
            <>
              <h3 className="text-lg font-semibold mb-3">General Areas</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-10">
                {generalCategories.map(({ key, label, icon: Icon }) => (
                  <CategoryBlock
                    key={key}
                    icon={Icon}
                    label={label}
                    categoryKey={key}
                    photos={photosByCategory[key]}
                    onClick={() => handleCategoryClick(key)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Hidden input */}
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

// =============================
// Category Block component
// =============================
function CategoryBlock({ icon: Icon, label, categoryKey, photos, onClick }) {
  return (
    <div className="flex flex-col items-center space-y-3">
      <button
        onClick={onClick}
        className="flex flex-col items-center justify-center w-28 h-28 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition relative shadow-sm"
      >
        <Icon className="w-6 h-6 text-primary mb-1" />
        <span className="text-sm font-medium">{label}</span>

        {photos?.length > 0 && (
          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
            {photos.length}
          </span>
        )}
      </button>

      {photos?.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2 w-28">
          {photos.map((f, i) => (
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
  );
}
