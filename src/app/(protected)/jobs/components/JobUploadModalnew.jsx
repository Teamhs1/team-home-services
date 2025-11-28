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
  Refrigerator,
  Wind,
} from "lucide-react";
import { toast } from "sonner";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

/* ============================================
   IMAGE OPTIMIZATION
============================================ */
async function processImage(file) {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const w = img.width;
      const h = img.height;
      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(img, 0, 0);

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
        (blob) =>
          resolve(
            new File([blob], file.name, { type: file.type || "image/jpeg" })
          ),
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

  // preview visual
  const [photosByCategory, setPhotosByCategory] = useState({});
  // archivos reales
  const [localFiles, setLocalFiles] = useState({});

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  /* ============================================
     TIMER
  ============================================ */
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

  /* ============================================
     UNIT TYPE & FEATURES
  ============================================ */
  const [unitType, setUnitType] = useState(null);

  const [features, setFeatures] = useState([]);

  const toggleFeature = (key) => {
    setFeatures((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  /* ============================================
     COMPARE CATEGORIES
  ============================================ */
  const dynamicCompareCategories = [
    { key: "stove", label: "Stove", icon: Flame },
    { key: "stove_back", label: "Behind Stove", icon: ChefHat },
    { key: "fridge", label: "Fridge", icon: IceCream },
    { key: "fridge_back", label: "Behind Fridge", icon: Snowflake },
    { key: "toilet", label: "Toilet", icon: Toilet },
    { key: "bathtub", label: "Bathtub", icon: Bath },
    { key: "sink", label: "Sink", icon: Droplet },

    ...(features.includes("dishwasher")
      ? [{ key: "dishwasher", label: "Dishwasher", icon: UtensilsCrossed }]
      : []),

    ...(features.includes("air_conditioner")
      ? [{ key: "ac_unit", label: "A/C Unit", icon: Wind }]
      : []),
  ];

  /* ============================================
     GENERAL AREAS (after)
  ============================================ */
  const generalCategories = [
    { key: "kitchen", label: "Kitchen", icon: UtensilsCrossed },
    { key: "bathroom", label: "Bathroom", icon: ShowerHead },
    { key: "living_room", label: "Living Room", icon: Armchair },

    ...(features.includes("laundry")
      ? [{ key: "laundry_unit", label: "Washer / Dryer", icon: Droplet }]
      : []),

    ...(features.includes("balcony")
      ? [{ key: "balcony_area", label: "Balcony", icon: Armchair }]
      : []),

    ...(features.includes("microwave")
      ? [{ key: "microwave_unit", label: "Microwave", icon: UtensilsCrossed }]
      : []),

    ...(features.includes("freezer")
      ? [{ key: "freezer_unit", label: "Freezer", icon: Refrigerator }]
      : []),

    ...(features.includes("glass_shower")
      ? [{ key: "glass_shower_area", label: "Glass Shower", icon: ShowerHead }]
      : []),

    ...(features.includes("double_sink")
      ? [{ key: "double_sink_area", label: "Double Sink", icon: Droplet }]
      : []),

    ...(type === "after" &&
    unitType &&
    ["1 Bed", "2 Beds", "3 Beds", "4 Beds"].includes(unitType)
      ? Array.from({ length: parseInt(unitType) }).map((_, i) => ({
          key: `bedroom_${i + 1}`,
          label: `Bedroom ${i + 1}`,
          icon: BedSingle,
        }))
      : []),
  ];

  const handleCategoryClick = (key) => {
    setSelectedCategory(key);
    setShowPicker(true);
  };

  /* ============================================
   LOCAL UPLOAD (LIMIT SINGLE PHOTO IN COMPARE)
============================================ */
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedCategory) return;

    // Detectar si la categoría es Compare
    const isCompare = dynamicCompareCategories.some(
      (c) => c.key === selectedCategory
    );

    // Solo usamos la primera foto si es Compare
    const fileToUse = isCompare ? files[0] : files;

    // Crear previews
    const previews = isCompare
      ? [
          {
            name: fileToUse.name,
            url: URL.createObjectURL(fileToUse),
          },
        ]
      : files.map((file) => ({
          name: file.name,
          url: URL.createObjectURL(file),
        }));

    // Guardar previews visuales
    setPhotosByCategory((prev) => ({
      ...prev,
      [selectedCategory]: isCompare
        ? previews // solo 1 foto
        : [...(prev[selectedCategory] || []), ...previews],
    }));

    // Guardar archivos reales
    setLocalFiles((prev) => ({
      ...prev,
      [selectedCategory]: isCompare
        ? [fileToUse] // reemplaza cualquier foto previa
        : [...(prev[selectedCategory] || []), ...files],
    }));

    e.target.value = "";
  };

  /* ============================================
     FINAL UPLOAD TO SUPABASE
  ============================================ */
  const uploadAllPhotos = async () => {
    const token = await window.Clerk.session.getToken({ template: "supabase" });
    if (!token) throw new Error("No Clerk token");

    for (const category of Object.keys(localFiles)) {
      for (const file of localFiles[category]) {
        const fixedFile = await processImage(file);

        const folderType = generalCategories.some((g) => g.key === category)
          ? "after"
          : type;

        const path = `${jobId}/${folderType}/${category}/${Date.now()}_${
          file.name
        }`;

        const formData = new FormData();
        formData.append("file", fixedFile);
        formData.append("path", path);
        formData.append("job_id", jobId);
        formData.append("category", category);
        formData.append("type", folderType);

        const res = await fetch("/api/job-photos/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }
    }
  };

  /* ============================================
     CONFIRM
  ============================================ */
  const handleConfirm = async () => {
    if (!Object.keys(localFiles).length) {
      toast.warning("Please upload at least one photo.");
      return;
    }

    setUploading(true);

    try {
      // subir TODO al final
      await uploadAllPhotos();

      if (type === "after") {
        await fetch("/api/job-activity/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: jobId }),
        });

        await updateStatus(jobId, "completed");
      } else {
        await updateStatus(jobId, "in_progress");
        // store unitType only at job start
        if (type === "before" && unitType) {
          await fetch("/api/job-unit-type", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ job_id: jobId, unit_type: unitType }),
          });
        }

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

  /* ============================================
     RENDER
  ============================================ */
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
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col z-[100000]"
        >
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

            {/* UNIT TYPE (ONLY ON START JOB) */}
            {type === "before" && (
              <>
                <h3 className="text-lg font-semibold mb-3">Unit Type</h3>

                <div className="mb-6">
                  <select
                    value={unitType || ""}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full border rounded-lg p-3 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="" disabled>
                      Select unit type...
                    </option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="1 Bed">1 Bed</option>
                    <option value="2 Beds">2 Beds</option>
                    <option value="3 Beds">3 Beds</option>
                    <option value="4 Beds">4 Beds</option>
                    <option value="Studio">Studio</option>
                    <option value="House">House</option>
                  </select>
                </div>
              </>
            )}

            {/* FEATURES */}
            <h3 className="text-lg font-semibold mb-3">Included Features</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
              {[
                { key: "air_conditioner", label: "Air Conditioner" },
                { key: "dishwasher", label: "Dishwasher" },
                { key: "microwave", label: "Microwave" },
                { key: "laundry", label: "Washer/Dryer" },
                { key: "freezer", label: "Freezer" },
                { key: "heat_pump", label: "Heat Pump" },
                { key: "balcony", label: "Balcony" },
                { key: "den", label: "Den / Office" },
                { key: "walkin_closet", label: "Walk-in Closet" },
                { key: "storage_room", label: "Storage Room" },
                { key: "carpeted_rooms", label: "Carpeted Rooms" },
                { key: "private_entrance", label: "Private Entrance" },
                { key: "glass_shower", label: "Glass Shower" },
                { key: "double_sink", label: "Double Sink" },
              ].map((f) => (
                <label
                  key={f.key}
                  className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer bg-white dark:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={features.includes(f.key)}
                    onChange={() => toggleFeature(f.key)}
                    className="w-4 h-4 accent-primary"
                  />
                  {f.label}
                </label>
              ))}
            </div>

            {/* COMPARE */}
            <h3 className="text-lg font-semibold mb-3">
              Compare Photos (Before / After)
            </h3>

            {unitType === null ? (
              <p className="text-sm text-red-500 mb-4">
                ❗ Please select a Unit Type first.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-10">
                {dynamicCompareCategories.map((c) => (
                  <CategoryBlock
                    key={c.key}
                    icon={c.icon}
                    label={c.label}
                    categoryKey={c.key}
                    photos={photosByCategory[c.key]}
                    setPhotosByCategory={setPhotosByCategory}
                    setLocalFiles={setLocalFiles}
                    onClick={() => handleCategoryClick(c.key)}
                  />
                ))}
              </div>
            )}

            {/* GENERAL */}
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
                      setPhotosByCategory={setPhotosByCategory}
                      setLocalFiles={setLocalFiles}
                      onClick={() => handleCategoryClick(c.key)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* INPUTS */}
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

          {/* FOOTER */}
          <div className="sticky bottom-0 w-full bg-white dark:bg-gray-900 border-t p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] z-[100001]">
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

          {/* PICKER */}
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

/* ============================================
   CATEGORY BLOCK COMPONENT (with delete button)
============================================ */
function CategoryBlock({
  icon: Icon,
  label,
  categoryKey,
  photos,
  onClick,
  setPhotosByCategory,
  setLocalFiles,
}) {
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
            <div key={i} className="relative w-full aspect-square">
              <img
                src={f.url}
                alt={f.name}
                className="w-full h-full object-cover rounded-lg border"
              />

              {/* DELETE BUTTON */}
              <button
                onClick={() => {
                  // remove preview
                  setPhotosByCategory((prev) => ({
                    ...prev,
                    [categoryKey]: prev[categoryKey].filter(
                      (_, idx) => idx !== i
                    ),
                  }));

                  // remove file
                  setLocalFiles((prev) => ({
                    ...prev,
                    [categoryKey]: prev[categoryKey].filter(
                      (_, idx) => idx !== i
                    ),
                  }));
                }}
                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
