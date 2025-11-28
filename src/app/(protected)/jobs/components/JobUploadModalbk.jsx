"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { toast } from "sonner";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// ======================================================
// 🔥 OPTIMIZACIÓN + ROTACIÓN EXIF (Samsung / Android)
// ======================================================
async function processImage(file) {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Mantener orientación ORIGINAL SIEMPRE
      const w = img.width;
      const h = img.height;

      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(img, 0, 0);

      // Redimensión opcional
      const MAX = 1600;
      const scale = Math.min(MAX / w, MAX / h, 1);

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = w * scale;
      finalCanvas.height = h * scale;

      finalCanvas
        .getContext("2d")
        .drawImage(
          canvas,
          0,
          0,
          w,
          h,
          0,
          0,
          finalCanvas.width,
          finalCanvas.height
        );

      finalCanvas.toBlob(
        (blob) => {
          resolve(
            new File([blob], file.name, { type: file.type || "image/jpeg" })
          );
        },
        "image/jpeg",
        0.92
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

export function JobUploadModal({
  jobId,
  type,
  onClose,
  updateStatus,
  fetchJobs,
}) {
  const [uploading, setUploading] = useState(false);
  const [photosByCategory, setPhotosByCategory] = useState({});

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  // ======================================================
  // ⏱️ TIMER EXACTO COMO JobTimer.jsx
  // ======================================================
  const [elapsed, setElapsed] = useState(null);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (!jobId) return;

    (async () => {
      try {
        const res = await fetch(`/api/job-activity/last-start?job_id=${jobId}`);
        const data = await res.json();
        if (data.startTime) {
          setStartTime(new Date(data.startTime));
        }
      } catch (err) {
        console.error("Timer error:", err);
      }
    })();
  }, [jobId]);

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsed(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (sec) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // ======================================================
  // CATEGORÍAS
  // ======================================================
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
    setShowPicker(true);
  };

  // ======================================================
  // UPLOAD
  // ======================================================
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedCategory) return;

    setUploading(true);

    try {
      const token = await window.Clerk.session.getToken({
        template: "supabase",
      });

      if (!token) throw new Error("No Clerk token");

      const previews = files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        pending: true,
      }));

      setPhotosByCategory((prev) => ({
        ...prev,
        [selectedCategory]: [...(prev[selectedCategory] || []), ...previews],
      }));

      const isGeneral = generalCategories.some(
        (g) => g.key === selectedCategory
      );

      if (isGeneral && type === "before") {
        toast.error("General photos solo pueden subirse AFTER.");
        setUploading(false);
        return;
      }

      const folderType = isGeneral ? "after" : type;

      for (const file of files) {
        const fixedFile = await processImage(file);

        const path = `${jobId}/${folderType}/${selectedCategory}/${Date.now()}_${
          file.name
        }`;

        const formData = new FormData();
        formData.append("file", fixedFile);
        formData.append("path", path);
        formData.append("job_id", jobId);
        formData.append("category", selectedCategory);
        formData.append("type", folderType);

        const res = await fetch("/api/job-photos/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

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
      toast.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ======================================================
  // CONFIRM
  // ======================================================
  const handleConfirm = async () => {
    if (!Object.keys(photosByCategory).length) {
      toast.warning("Please upload at least one photo.");
      return;
    }

    setUploading(true);

    try {
      if (type === "after") {
        await fetch("/api/job-activity/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: jobId }),
        });

        await updateStatus(jobId, "completed");
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

        setStartTime(new Date());
      }

      toast.success(type === "after" ? "Job completed!" : "Job started!");

      await fetchJobs?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  // ======================================================
  // RENDER MODAL
  // ======================================================
  const modal = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="
            relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl 
            w-full max-w-3xl max-h-[90vh] 
            flex flex-col
            z-[100000]
          "
        >
          {/* ===== CONTENIDO SCROLLEABLE ===== */}
          <div className="overflow-y-auto px-6 pt-6 pb-32">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <X size={22} />
            </button>

            <h2 className="text-xl font-bold text-center">
              {type === "before"
                ? "Upload Photos Before Starting"
                : "Upload Photos After Completing"}
            </h2>

            {elapsed !== null && (
              <div className="text-center text-blue-600 text-lg font-semibold mt-2 mb-6">
                ⏱️ {formatTime(elapsed)}
              </div>
            )}

            <h3 className="text-lg font-semibold mb-3">
              Compare Photos (Before / After)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-10">
              {compareCategories.map((c) => (
                <CategoryBlock
                  key={c.key}
                  icon={c.icon}
                  label={c.label}
                  categoryKey={c.key}
                  photos={photosByCategory[c.key]}
                  onClick={() => handleCategoryClick(c.key)}
                />
              ))}
            </div>

            {type === "after" && (
              <>
                <h3 className="text-lg font-semibold mb-3">General Areas</h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-10">
                  {generalCategories.map((c) => (
                    <CategoryBlock
                      key={c.key}
                      icon={c.icon}
                      label={c.label}
                      categoryKey={c.key}
                      photos={photosByCategory[c.key]}
                      onClick={() => handleCategoryClick(c.key)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Inputs ocultos */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              className="hidden"
              onChange={handleUpload}
            />

            <input
              type="file"
              accept="image/*"
              ref={galleryInputRef}
              className="hidden"
              onChange={handleUpload}
            />

            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={handleUpload}
            />
          </div>

          {/* ===== FOOTER FIJO ===== */}
          <div
            className="
              sticky bottom-0 
              w-full 
              bg-white dark:bg-gray-900 
              border-t 
              p-4 
              shadow-[0_-4px_12px_rgba(0,0,0,0.15)]
              z-[100001]
            "
          >
            <Button
              className="w-full"
              disabled={uploading}
              onClick={handleConfirm}
            >
              {uploading
                ? "Uploading..."
                : type === "before"
                ? "Confirm & Start Job"
                : "Confirm & Complete Job"}
            </Button>
          </div>

          {/* ============================
              📸 BOTTOM SHEET PICKER
          ============================= */}
          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-[999999] flex items-end justify-center"
                onClick={() => setShowPicker(false)}
              >
                <motion.div
                  initial={{ y: 150 }}
                  animate={{ y: 0 }}
                  exit={{ y: 150 }}
                  transition={{ duration: 0.25 }}
                  className="w-full bg-white dark:bg-gray-800 rounded-t-2xl p-6 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-semibold text-center mb-4">
                    Choose an option
                  </h3>

                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={() => {
                        setShowPicker(false);
                        cameraInputRef.current?.click();
                      }}
                      className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold"
                    >
                      📷 Take Photo
                    </button>

                    <button
                      onClick={() => {
                        setShowPicker(false);
                        galleryInputRef.current?.click();
                      }}
                      className="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold"
                    >
                      🖼️ Gallery
                    </button>

                    <button
                      onClick={() => {
                        setShowPicker(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full py-3 rounded-xl bg-gray-700 text-white font-semibold"
                    >
                      📁 File Manager
                    </button>

                    <button
                      onClick={() => setShowPicker(false)}
                      className="w-full py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}

// ======================================================
// CATEGORY BLOCK
// ======================================================
function CategoryBlock({ icon: Icon, label, categoryKey, photos, onClick }) {
  return (
    <div className="flex flex-col items-center space-y-3">
      <button
        onClick={onClick}
        className="
          flex flex-col items-center justify-center 
          w-28 h-28 rounded-xl border border-gray-300 dark:border-gray-700 
          bg-white dark:bg-gray-800 transition relative shadow-sm
        "
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
              className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg border overflow-hidden"
            >
              <img
                src={f.url}
                alt={f.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
