"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useUser, useAuth } from "@clerk/nextjs";

import JobHeader from "./components/JobHeader";
import JobCompare from "./components/JobCompare";
import JobGallery from "./components/JobGallery";

import { JobUploadModal } from "../components/job-upload/JobUploadModal";
import { AnimatePresence } from "framer-motion";

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
  const { getToken } = useAuth();

  const [photos, setPhotos] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // MODAL (Start / Complete Job)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);

  const openModal = (jobId, type) => {
    setCurrentJob(jobId);
    setModalType(type);
    setModalOpen(true);
  };

  // ===============================
  // 🔐 SUPABASE WITH CLERK TOKEN
  // ===============================
  const getSupabase = async () => {
    const token = await getToken({ template: "supabase" });

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
  };

  // ===============================
  // 📸 REFRESH PHOTOS (NO RELOAD)
  // ===============================
  const refreshPhotos = async () => {
    const res = await fetch(`/api/job-photos/list?job_id=${id}`);
    const result = await res.json();

    const grouped = result.data || {
      before: [],
      after: [],
      general: [],
    };

    const detectType = (p) => {
      if (p.type) return p.type.toLowerCase();

      const url = (p.image_url || "").toLowerCase();
      if (url.includes("/before/") || url.includes("before_")) return "before";
      if (url.includes("/after/") || url.includes("after_")) return "after";

      return "general";
    };

    const allPhotos = [
      ...grouped.before.map((p) => ({ ...p, type: detectType(p) })),
      ...grouped.after.map((p) => ({ ...p, type: detectType(p) })),
      ...grouped.general.map((p) => ({ ...p, type: detectType(p) })),
    ];

    setPhotos(allPhotos);
  };

  // ===============================
  // 🔄 REFRESH JOB DATA (WITH RLS)
  // ===============================
  const refreshJobData = async () => {
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("cleaning_jobs")
      .select(
        "id, title, service_type, scheduled_date, status, unit_type, features"
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("❌ Error refreshing job:", error);
    }

    setJob(data || null);
  };

  const closeModal = async () => {
    setModalOpen(false);
    setModalType(null);
    setCurrentJob(null);

    await refreshPhotos();
    await refreshJobData();
  };

  // ===============================
  // 🚀 INITIAL LOAD
  // ===============================
  useEffect(() => {
    if (!id || !user) return;

    (async () => {
      try {
        setLoading(true);

        const supabase = await getSupabase();

        const { data, error } = await supabase
          .from("cleaning_jobs")
          .select(
            "id, title, service_type, scheduled_date, status, unit_type, features"
          )
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error("❌ Error loading job:", error);
        }

        setJob(data || null);
        await refreshPhotos();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  const publicUrl = getPublicUrl;

  // ===============================
  // 🎯 VISUAL LOGIC
  // ===============================
  const showCompare = job?.status === "completed";

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

  const generalPhotos = showCompare
    ? photos.filter(
        (p) =>
          p.type === "general" &&
          /\.(jpg|jpeg|png|webp|gif)$/i.test(publicUrl(p.image_url))
      )
    : [];

  const galleryBeforePhotos = showCompare ? [] : beforePhotos;
  const galleryAfterPhotos = showCompare ? [] : afterPhotos;

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

        <JobCompare
          beforePhotos={beforePhotos}
          afterPhotos={afterPhotos}
          publicUrl={publicUrl}
        />

        <JobGallery
          beforePhotos={galleryBeforePhotos}
          afterPhotos={galleryAfterPhotos}
          generalPhotos={generalPhotos}
          publicUrl={publicUrl}
        />
      </div>

      <AnimatePresence>
        {modalOpen && currentJob && (
          <JobUploadModal
            key={currentJob}
            jobId={currentJob}
            type={modalType}
            onClose={closeModal}
            updateStatus={async (jobId, newStatus) => {
              const supabase = await getSupabase();
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
