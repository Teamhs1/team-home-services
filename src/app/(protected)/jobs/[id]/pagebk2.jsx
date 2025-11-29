"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

import JobHeader from "./components/JobHeader";
import JobCompare from "./components/JobCompare";
import JobGallery from "./components/JobGallery";

import { JobUploadModal } from "../components/job-upload/JobUploadModal";
import { AnimatePresence } from "framer-motion";

import { FEATURE_ICONS } from "../components/job-upload/featureIcons";
import { FEATURES } from "../components/job-upload/features";
import { UNIT_TYPE_ICONS } from "../components/job-upload/unitTypeIcons";

// =======================================================
// 🔥 PUBLIC URL NORMALIZER (versión robusta)
// =======================================================
const getPublicUrl = (url) => {
  if (!url) return "";

  // Si ya es URL pública
  if (url.startsWith("http")) {
    return url
      .replaceAll(" ", "%20")
      .replaceAll("(", "%28")
      .replaceAll(")", "%29")
      .replaceAll("#", "%23");
  }

  // LIMPIEZA DEL PATH
  const clean = url
    .replace(/^\/?job-photos\//, "")
    .replace(/^\/?storage\/v1\/object\/public\/job-photos\//, "")
    .replace(/^\/+/, "")
    .trim();

  // ENCODE DE TODOS LOS SEGMENTOS
  const encoded = clean
    .split("/")
    .map((segment) =>
      encodeURIComponent(segment)
        .replaceAll("(", "%28")
        .replaceAll(")", "%29")
        .replaceAll("#", "%23")
    )
    .join("/");

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/job-photos/${encoded}`;
};

export default function JobPhotosPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();

  const [photos, setPhotos] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);

  const openModal = (jobId, type) => {
    setCurrentJob(jobId);
    setModalType(type);
    setModalOpen(true);
  };

  // =======================================================
  // 🔄 Refresh PHOTOS
  // =======================================================
  const refreshPhotos = async () => {
    const res = await fetch(`/api/job-photos/list?job_id=${id}`);
    const json = await res.json();

    const data = json.data || { before: [], after: [], general: [] };

    const detectType = (p) => {
      const url = p.image_url?.toLowerCase() || "";
      if (p.type) return p.type.toLowerCase();
      if (url.includes("/before/") || url.includes("before_")) return "before";
      if (url.includes("/after/") || url.includes("after_")) return "after";
      return "general";
    };

    const all = [
      ...data.before.map((p) => ({ ...p, type: detectType(p) })),
      ...data.after.map((p) => ({ ...p, type: detectType(p) })),
      ...data.general.map((p) => ({ ...p, type: detectType(p) })),
    ];

    setPhotos(all);
  };

  // =======================================================
  // 🔄 Refresh ONLY Job Data
  // =======================================================
  const refreshJobData = async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data } = await supabase
      .from("cleaning_jobs")
      .select(
        "id, title, service_type, scheduled_date, status, unit_type, features"
      )
      .eq("id", id)
      .maybeSingle();

    setJob(data || null);
  };

  // =======================================================
  // 🔄 Close modal → reload everything
  // =======================================================
  const closeModal = async () => {
    setModalOpen(false);
    setModalType(null);
    setCurrentJob(null);

    await refreshPhotos();
    await refreshJobData();
  };

  // =======================================================
  // ⏳ Load on page load
  // =======================================================
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);

        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data: jobData } = await supabase
          .from("cleaning_jobs")
          .select(
            "id, title, service_type, scheduled_date, status, unit_type, features"
          )
          .eq("id", id)
          .maybeSingle();

        setJob(jobData || null);
        await refreshPhotos();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const publicUrl = getPublicUrl;

  // =======================================================
  // 📸 FILTER PHOTOS (fixed)
  // =======================================================
  const beforePhotos = photos.filter((p) => p.type === "before");

  const afterPhotos = photos.filter((p) => p.type === "after");

  const generalPhotos = photos.filter(
    (p) =>
      ["kitchen", "bathroom", "bedroom", "living_room"].includes(
        p.category?.toLowerCase()
      ) && /\.(jpg|jpeg|png|webp|gif)$/i.test(publicUrl(p.image_url))
  );

  // =======================================================
  // LOADING UI
  // =======================================================
  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-gray-500 w-6 h-6" />
      </div>
    );

  return (
    <>
      <div className="mt-32 px-6 py-10 max-w-6xl mx-auto space-y-10">
        <JobHeader job={job} router={router} openModal={openModal} />

        {/* UNIT TYPE */}
        {job?.unit_type && (
          <div className="text-center mt-4">
            <p className="text-gray-500 text-sm">Unit Type</p>

            <div className="flex gap-2 justify-center items-center mt-1">
              {(() => {
                const Icon = UNIT_TYPE_ICONS[job.unit_type.toLowerCase()];
                return Icon ? (
                  <Icon size={20} className="text-blue-600" />
                ) : null;
              })()}

              <p className="capitalize text-lg font-semibold text-blue-600">
                {job.unit_type}
              </p>
            </div>
          </div>
        )}

        {/* FEATURES */}
        {Array.isArray(job?.features) && job.features.length > 0 && (
          <div className="text-center mb-8">
            <p className="text-gray-500 text-sm">Included Features</p>

            <div className="flex flex-wrap gap-3 justify-center mt-3">
              {job.features.map((feat) => {
                const Icon = FEATURE_ICONS[feat];
                const label =
                  FEATURES.find((f) => f.key === feat)?.label || feat;

                return (
                  <span
                    key={feat}
                    className="flex items-center gap-2 px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 shadow-sm"
                  >
                    {Icon && <Icon size={14} className="opacity-80" />}
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* BEFORE / AFTER */}
        <JobCompare
          beforePhotos={beforePhotos}
          afterPhotos={afterPhotos}
          publicUrl={publicUrl}
        />

        {/* GALLERY */}
        <JobGallery
          beforePhotos={beforePhotos}
          afterPhotos={afterPhotos}
          generalPhotos={generalPhotos}
          publicUrl={publicUrl}
        />
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {modalOpen && currentJob && (
          <JobUploadModal
            key={currentJob}
            jobId={currentJob}
            type={modalType}
            onClose={closeModal}
            updateStatus={async (jobId, newStatus) => {
              const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              );
              await supabase
                .from("cleaning_jobs")
                .update({ status: newStatus })
                .eq("id", jobId);
            }}
            fetchJobs={() => {}}
          />
        )}
      </AnimatePresence>
    </>
  );
}
