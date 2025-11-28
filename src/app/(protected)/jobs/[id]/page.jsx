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

// 🔥 IMPORTA ICONOS DE FEATURES Y UNIT TYPE
import { FEATURE_ICONS } from "../components/job-upload/featureIcons";
import { FEATURES } from "../components/job-upload/features";
import { UNIT_TYPE_ICONS } from "../components/job-upload/unitTypeIcons";

// ===============================
// PUBLIC URL GENERATOR
// ===============================
const getPublicUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const clean = url.replace(/^\/?job-photos\//, "").trim();
  const encoded = clean
    .split("/")
    .map((x) => encodeURIComponent(x))
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

  // ===============================
  // MODAL (Start / Complete Job)
  // ===============================
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);

  const openModal = (jobId, type) => {
    setCurrentJob(jobId);
    setModalType(type);
    setModalOpen(true);
  };

  // ===============================
  // Refresh photos WITHOUT reload
  // ===============================
  const refreshPhotos = async () => {
    const res = await fetch(`/api/job-photos/list?job_id=${id}`);
    const result = await res.json();

    const grouped = result.data || { before: [], after: [], general: [] };

    const detectType = (p) => {
      const url = p.image_url || "";
      if (!url || url === "general" || url === "null" || url === "undefined")
        return null;

      const lower = url.toLowerCase();
      if (p.type) return p.type.toLowerCase();
      if (lower.includes("/before/") || lower.includes("before_"))
        return "before";
      if (lower.includes("/after/") || lower.includes("after_")) return "after";

      return "general";
    };

    const allPhotos = [
      ...grouped.before.map((p) => ({ ...p, type: detectType(p) })),
      ...grouped.after.map((p) => ({ ...p, type: detectType(p) })),
      ...grouped.general.map((p) => ({ ...p, type: detectType(p) })),
    ].filter((p) => p.type !== null);

    setPhotos(allPhotos);
  };

  // ===============================
  // Refresh ONLY job info
  // ===============================
  const refreshJobData = async () => {
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
  };

  // ===============================
  // Close modal → refresh all
  // ===============================
  const closeModal = async () => {
    setModalOpen(false);
    setModalType(null);
    setCurrentJob(null);

    await refreshPhotos();
    await refreshJobData();
  };

  // ===============================
  // LOAD JOB + PHOTOS ON PAGE LOAD
  // ===============================
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
      } catch (err) {
        console.error("❌ Error:", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const publicUrl = getPublicUrl;

  const beforePhotos = photos.filter(
    (p) =>
      p.type === "before" &&
      /\.(jpg|jpeg|png|webp|gif)$/i.test(publicUrl(p.image_url))
  );

  const afterPhotos = photos.filter(
    (p) =>
      p.type === "after" &&
      /\.(jpg|jpeg|png|webp|gif)$/i.test(publicUrl(p.image_url))
  );

  const generalPhotos = photos.filter(
    (p) =>
      p.type === "general" &&
      /\.(jpg|jpeg|png|webp|gif)$/i.test(publicUrl(p.image_url))
  );

  // ===============================
  // LOADING UI
  // ===============================
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

        {/* ================================
            SHOW UNIT TYPE + ICON
        ================================= */}
        {job?.unit_type && (
          <div className="mt-2 mb-4 text-center">
            <p className="text-gray-500 text-sm">Unit Type</p>

            <div className="flex items-center justify-center gap-2 mt-1">
              {(() => {
                const Icon =
                  UNIT_TYPE_ICONS[job.unit_type?.toLowerCase()] || null;
                return Icon ? (
                  <Icon size={20} className="text-blue-600" />
                ) : null;
              })()}

              <p className="text-lg font-semibold text-blue-600 capitalize">
                {job.unit_type}
              </p>
            </div>
          </div>
        )}

        {/* ================================
            FEATURES WITH ICONS
        ================================= */}
        {Array.isArray(job?.features) && job.features.length > 0 && (
          <div className="text-center mb-10">
            <p className="text-gray-500 text-sm">Included Features</p>

            <div className="flex flex-wrap gap-3 justify-center mt-3">
              {job.features.map((feat) => {
                const Icon = FEATURE_ICONS[feat];
                const label =
                  FEATURES.find((f) => f.key === feat)?.label || feat;

                return (
                  <span
                    key={feat}
                    className="flex items-center gap-2 px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 shadow-sm"
                  >
                    {Icon && <Icon size={14} className="opacity-80" />}
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <JobCompare
          beforePhotos={beforePhotos}
          afterPhotos={afterPhotos}
          publicUrl={publicUrl}
        />

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
