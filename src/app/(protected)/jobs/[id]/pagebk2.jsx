"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

import JobHeader from "./components/JobHeader";
import JobCompare from "./components/JobCompare";
import JobGallery from "./components/JobGallery";

import { JobUploadModal } from "../components/JobUploadModal"; // ✅ FIX: named import
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

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setCurrentJob(null);
  };

  // ===============================
  // LOAD JOB + PHOTOS
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

        // Load job
        const { data: jobData } = await supabase
          .from("cleaning_jobs")
          .select("id, title, service_type, scheduled_date, status")
          .eq("id", id)
          .maybeSingle();

        setJob(jobData || null);

        // Load photos
        const res = await fetch(`/api/job-photos/list?job_id=${id}`);
        const result = await res.json();

        const grouped = result.data || {
          before: [],
          after: [],
          general: [],
        };

        const detectType = (p) => {
          const url = p.image_url?.toLowerCase() || "";
          if (p.type) return p.type.toLowerCase();
          if (url.includes("before_")) return "before";
          if (url.includes("after_")) return "after";
          if (url.includes("/before/")) return "before";
          if (url.includes("/after/")) return "after";
          return "general";
        };

        const allPhotos = [
          ...grouped.before.map((p) => ({ ...p, type: detectType(p) })),
          ...grouped.after.map((p) => ({ ...p, type: detectType(p) })),
          ...grouped.general.map((p) => ({ ...p, type: detectType(p) })),
        ];

        setPhotos(allPhotos);
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
      (p.type === "before" || p.category?.toLowerCase() === "before") &&
      /\.(jpg|jpeg|png|webp|gif)$/i.test(publicUrl(p.image_url))
  );

  const afterPhotos = photos.filter(
    (p) =>
      (p.type === "after" || p.category?.toLowerCase() === "after") &&
      /\.(jpg|jpeg|png|webp|gif)$/i.test(publicUrl(p.image_url))
  );

  const generalPhotos = photos.filter((p) =>
    ["kitchen", "bathroom", "bedroom", "living_room"].includes(
      p.category?.toLowerCase()
    )
  );

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-gray-500 w-6 h-6" />
      </div>
    );

  return (
    <>
      <div className="mt-32 px-6 py-10 max-w-6xl mx-auto space-y-10">
        {/* Pass openModal to header buttons */}
        <JobHeader job={job} router={router} openModal={openModal} />

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
            updateStatus={null}
            fetchJobs={null}
          />
        )}
      </AnimatePresence>
    </>
  );
}
