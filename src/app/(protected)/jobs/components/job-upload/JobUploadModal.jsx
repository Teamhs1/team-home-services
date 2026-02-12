"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { FEATURE_ICONS } from "./featureIcons";
import CategoryBlock from "./CategoryBlock";
import { FEATURES } from "./features";
import { staticCompare, compareFromFeatures, generalAreas } from "./categories";
import { processImage } from "./processImage";

const UNIT_TYPES = [
  { key: "bachelor", label: "Bachelor" },
  { key: "1_bed", label: "1 Bed" },
  { key: "2_beds", label: "2 Beds" },
  { key: "3_beds", label: "3 Beds" },
  { key: "4_beds", label: "4 Beds" },
  { key: "studio", label: "Studio" },
  { key: "house", label: "House" },
];

// 🔥 ICONOS DE UNIT TYPE
import { UNIT_TYPE_ICONS } from "./unitTypeIcons";

export function JobUploadModal({
  jobId,
  type, // "before" or "after"
  onClose,
  updateStatus,
  fetchJobs,
  updateLocalJob,
}) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const [photosByCategory, setPhotosByCategory] = useState({});
  const [localFiles, setLocalFiles] = useState({});
  const [unitType, setUnitType] = useState(null);
  const [features, setFeatures] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [elapsed, setElapsed] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const authFetch = async (url, options = {}) => {
    const token = await getToken({ template: "supabase" });

    if (!token) throw new Error("Not authenticated");

    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  };

  useEffect(() => {
    if (!jobId) return;

    (async () => {
      try {
        const res = await fetch(`/api/job-activity/last-start?job_id=${jobId}`);
        const data = await res.json();
        if (data?.startTime) {
          setStartTime(new Date(data.startTime));
        }
      } catch (err) {
        console.error("Failed to load start time", err);
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
  useEffect(() => {
    if (type !== "after" || !jobId) return;

    (async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        // 🔥 CARGAR LO DEL BEFORE
        setUnitType(data.unit_type || null);
        setFeatures(Array.isArray(data.features) ? data.features : []);
      } catch (err) {
        console.error("Failed to load job data", err);
        toast.error("Failed to load job info");
      }
    })();
  }, [type, jobId]);

  const getUnitTypeLabel = (key) => {
    return UNIT_TYPES.find((u) => u.key === key)?.label || key;
  };

  // --------------------------------------------------------
  // TOGGLE FEATURES
  // --------------------------------------------------------
  const toggleFeature = (key) => {
    setFeatures((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key],
    );
  };

  // --------------------------------------------------------
  // CATEGORY LISTS
  // --------------------------------------------------------
  const dynamicCompareCategories = [
    ...staticCompare,
    ...compareFromFeatures(features),
  ];

  const normalizedUnitType = unitType?.toLowerCase()?.replace(/\s+/g, "_");

  const generalCategories = generalAreas(features, type, normalizedUnitType);

  const handleCategoryClick = (key) => {
    setSelectedCategory(key);
    setShowPicker(true);
  };

  // --------------------------------------------------------
  // LOCAL UPLOAD
  // --------------------------------------------------------
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedCategory) return;

    const previews = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setPhotosByCategory((prev) => ({
      ...prev,
      [selectedCategory]: [...(prev[selectedCategory] || []), ...previews],
    }));

    setLocalFiles((prev) => ({
      ...prev,
      [selectedCategory]: [...(prev[selectedCategory] || []), ...files],
    }));

    e.target.value = "";
  };

  // --------------------------------------------------------
  // SUBIR TODO
  // --------------------------------------------------------
  const uploadAllPhotos = async () => {
    const token = await getToken({ template: "supabase" });

    if (!token) throw new Error("No Clerk token");

    for (const category of Object.keys(localFiles)) {
      for (const file of localFiles[category]) {
        const optimized = await processImage(file);

        const isCompareCategory = dynamicCompareCategories.some(
          (c) => c.key === category,
        );

        let folderType = type;

        // 🔥 si el job se está COMPLETANDO
        if (type === "after") {
          folderType = isCompareCategory ? "after" : "general";
        }

        const path = `${jobId}/${folderType}/${category}/${Date.now()}_${
          file.name
        }`;

        const formData = new FormData();
        formData.append("file", optimized);
        formData.append("path", path);
        formData.append("job_id", jobId);
        formData.append("category", category);
        formData.append("type", folderType);

        // ⏱️ timeout de seguridad (20s)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        let res;
        try {
          res = await fetch("/api/job-photos/upload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
            signal: controller.signal,
          });
        } catch (err) {
          if (err.name === "AbortError") {
            throw new Error("Upload timed out. Please try again.");
          }
          throw err;
        } finally {
          clearTimeout(timeout);
        }

        let json = {};
        try {
          json = await res.json();
        } catch {}

        if (!res.ok) {
          throw new Error(json.error || "Photo upload failed");
        }
      }
    }
  };

  // --------------------------------------------------------
  // CONFIRM
  // --------------------------------------------------------
  const getAuthHeaders = async () => {
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("Not authenticated");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const handleConfirm = async () => {
    if (!Object.keys(localFiles).length) {
      toast.warning("Please upload at least one photo.");
      return;
    }

    setUploading(true);

    try {
      await uploadAllPhotos();

      // =========================
      // AFTER → COMPLETE JOB
      // =========================
      if (type === "after") {
        // 🔥 Guardar unit_type y features usando API segura
        await authFetch("/api/jobs/update-meta", {
          method: "POST",
          body: JSON.stringify({
            jobId,
            unit_type: unitType,
            features,
          }),
        });

        updateLocalJob?.(jobId, { unit_type: unitType, features });

        // ✅ 2) STOP timer (solo log, NO completa)
        await authFetch("/api/job-activity/stop", {
          method: "POST",
          body: JSON.stringify({ jobId }),
        });

        // ✅ 3) Normalizar fotos (esperar a que termine)
        const normRes = await authFetch("/api/job-photos/normalize-general", {
          method: "POST",
          body: JSON.stringify({ jobId }),
        });

        const normJson = await normRes.json().catch(() => ({}));
        if (!normRes.ok)
          throw new Error(normJson.error || "Failed to finalize photos");

        // ✅ 4) Completar job (status + completed_at)
        const statusRes = await updateStatus(jobId, "completed");
        // (si updateStatus no retorna nada, no pasa nada)

        // ✅ 5) Actualizar UI sí o sí (AQUÍ estaba tu problema)
        updateLocalJob?.(jobId, {
          status: "completed",
          completed_at: new Date().toISOString(),
        });
        await fetchJobs?.();

        toast.success("Job completed!");
        onClose();
        router.push(`/jobs/${jobId}`);
        return;
      }
      // 🔥 GUARDAR unit_type y features ANTES DE START
      await authFetch("/api/jobs/update-meta", {
        method: "POST",
        body: JSON.stringify({
          jobId,
          unit_type: unitType,
          features,
        }),
      });

      // =========================
      // BEFORE → START JOB (SERVER)
      // =========================
      const res = await authFetch("/api/job-activity/start", {
        method: "POST",
        body: JSON.stringify({ jobId }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to start job");
      }

      // 🔥 actualizar UI local (optimistic)
      updateLocalJob?.(jobId, {
        status: "in_progress",
        started_at: new Date().toISOString(),
        unit_type: unitType,
        features: Array.isArray(features) ? features : [],
      });

      await fetchJobs?.();

      toast.success("Job started!");
      onClose();
      router.push(`/jobs/${jobId}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  // --------------------------------------------------------
  // ORDENAR FEATURES EN AFTER
  // --------------------------------------------------------
  const FEATURE_ORDER = [
    "dishwasher",
    "microwave",
    "freezer",
    "air_conditioner",
    "heat_pump",
    "laundry",
    "glass_shower",
    "double_sink",
    "balcony",
    "den",
    "walkin_closet",
    "storage_room",
    "carpeted_rooms",
    "private_entrance",
  ];

  const orderedSelectedFeatures = FEATURE_ORDER.filter((key) =>
    features.includes(key),
  );
  // 🔥 VALIDAR QUE TODAS LAS CATEGORÍAS TENGAN FOTO

  // 🔥 SIEMPRE OBLIGATORIAS (BASE)
  const requiredCompareKeys = staticCompare.map((c) => c.key);

  // 🔥 Dinámicas solo si existen
  const dynamicCompareKeys = compareFromFeatures(features).map((c) => c.key);

  // 🔥 General solo en AFTER
  const requiredGeneralKeys =
    type === "after" ? generalCategories.map((c) => c.key) : [];

  // 🔥 Unir todas las requeridas
  const requiredKeys = [
    ...requiredCompareKeys,
    ...dynamicCompareKeys,
    ...requiredGeneralKeys,
  ];

  // 🔥 VALIDACIÓN REAL
  const allCategoriesHavePhotos =
    requiredKeys.length > 0 &&
    requiredKeys.every(
      (key) => photosByCategory[key] && photosByCategory[key].length > 0,
    );

  // --------------------------------------------------------
  // UI
  // --------------------------------------------------------
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
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        >
          <div className="overflow-y-auto px-6 pt-6 pb-32">
            {/* CLOSE */}
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <X size={22} />
            </button>

            {/* TITLE */}
            <h2 className="text-xl font-bold text-center">
              {type === "before"
                ? "Upload Photos Before Starting"
                : "Upload Photos After Completing"}
            </h2>

            {/* UNIT TYPE IN AFTER */}
            {type === "after" && unitType && (
              <div className="text-center mt-2 flex items-center justify-center gap-2">
                {(() => {
                  const Icon =
                    UNIT_TYPE_ICONS[
                      unitType?.toLowerCase().replace(/\s+/g, "_")
                    ] || null;

                  return Icon ? (
                    <Icon size={18} className="text-blue-600" />
                  ) : null;
                })()}

                <p className="text-lg font-semibold text-blue-600">
                  {getUnitTypeLabel(unitType)}
                </p>
              </div>
            )}

            {elapsed !== null && (
              <div className="text-center text-blue-600 text-lg font-semibold mt-2 mb-6">
                ⏱️ {formatTime(elapsed)}
              </div>
            )}

            <select
              value={unitType || ""}
              onChange={(e) => setUnitType(e.target.value)}
              className="w-full border rounded-lg p-3 bg-white dark:bg-gray-800 text-sm pr-10"
            >
              <option value="" disabled>
                Select unit type...
              </option>

              <option value="bachelor">Bachelor</option>
              <option value="1_bed">1 Bed</option>
              <option value="2_beds">2 Beds</option>
              <option value="3_beds">3 Beds</option>
              <option value="4_beds">4 Beds</option>
              <option value="studio">Studio</option>
              <option value="house">House</option>
            </select>

            {/* ====================================================
                FEATURES
            ==================================================== */}
            <h3 className="text-lg font-semibold mb-3">Included Features</h3>

            {type === "before" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
                {FEATURES.map((f) => (
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
            ) : (
              <div className="flex flex-wrap gap-3 mb-10">
                {orderedSelectedFeatures.map((featKey, idx) => {
                  const Icon = FEATURE_ICONS[featKey];
                  const label =
                    FEATURES.find((f) => f.key === featKey)?.label ||
                    featKey.replaceAll("_", " ");

                  return (
                    <span
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl 
                          bg-blue-50 text-blue-700 
                          dark:bg-blue-900/40 dark:text-blue-200 
                          text-sm font-medium shadow-sm border border-blue-200/40 
                          dark:border-blue-800/40"
                    >
                      {Icon && (
                        <Icon
                          size={16}
                          className="text-blue-600 dark:text-blue-300"
                        />
                      )}
                      {label}
                    </span>
                  );
                })}

                {orderedSelectedFeatures.length === 0 && (
                  <p className="text-gray-500 text-sm italic">
                    No features selected.
                  </p>
                )}
              </div>
            )}

            {/* COMPARE */}
            <h3 className="text-lg font-semibold mb-3">Compare Photos</h3>

            {type === "before" && unitType === null ? (
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

            {/* GENERAL AREAS */}
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

            {/* FILE INPUTS */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleUpload}
            />

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
          </div>

          {/* FOOTER */}
          <div className="sticky bottom-0 w-full bg-white dark:bg-gray-900 border-t p-4">
            <Button
              className="w-full"
              disabled={uploading || !allCategoriesHavePhotos}
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
                  initial={{ y: 160 }}
                  animate={{ y: 0 }}
                  exit={{ y: 160 }}
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
                      className="w-full py-3 rounded-xl border text-gray-700 dark:text-gray-300 font-semibold"
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
