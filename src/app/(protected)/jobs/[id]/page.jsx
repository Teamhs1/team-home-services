"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useUser, useAuth } from "@clerk/nextjs";

import JobHeader from "./components/JobHeader";
import JobCompare from "./components/JobCompare";
import JobGallery from "./components/JobGallery";

import { JobUploadModal } from "../components/job-upload/JobUploadModal";

import { AnimatePresence } from "framer-motion";

// ✅ FUENTE DE VERDAD
import {
  staticCompare,
  compareFromFeatures,
  generalAreas,
} from "../components/job-upload/categories";

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

  // MODAL
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);

  const openModal = (jobId, type) => {
    setCurrentJob(jobId);
    setModalType(type);
    setModalOpen(true);
  };

  // ===============================
  // 🔐 SUPABASE
  // ===============================
  const getSupabase = async () => {
    const token = await getToken({ template: "supabase" });

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );
  };

  // ===============================
  // 📸 PHOTOS
  // ===============================
  const refreshPhotos = async () => {
    const res = await fetch(`/api/job-photos/list?job_id=${id}`);
    const result = await res.json();

    const grouped = result.data || { before: [], after: [], general: [] };
    setPhotos([...grouped.before, ...grouped.after, ...grouped.general]);
  };

  // ===============================
  // 🔄 JOB
  // ===============================
  const refreshJobData = async () => {
    const supabase = await getSupabase();

    const { data } = await supabase
      .from("cleaning_jobs")
      .select(
        "id, title, service_type, scheduled_date, status, unit_type, features"
      )
      .eq("id", id)
      .maybeSingle();

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
  // 🚀 INIT
  // ===============================
  useEffect(() => {
    if (!id || !user) return;

    (async () => {
      setLoading(true);
      await refreshJobData();
      await refreshPhotos();
      setLoading(false);
    })();
  }, [id, user]);

  const publicUrl = getPublicUrl;

  // ===============================
  // 🎯 CATEGORY LOGIC (CORRECTO)
  // ===============================
  const compareKeys = useMemo(() => {
    if (!job) return [];
    return [
      ...staticCompare.map((c) => c.key),
      ...compareFromFeatures(job.features || []).map((c) => c.key),
    ];
  }, [job]);

  const areaKeys = useMemo(() => {
    if (!job) return [];
    return generalAreas(job.features || [], "after", job.unit_type).map(
      (a) => a.key
    );
  }, [job]);

  const isImage = (url) => /\.(jpg|jpeg|png|webp|gif)$/i.test(publicUrl(url));

  // ===============================
  // 📸 FILTERS (FINAL)
  // ===============================
  const beforePhotos = photos.filter(
    (p) =>
      p.type === "before" &&
      compareKeys.includes(p.category) &&
      isImage(p.image_url)
  );

  const afterPhotos = photos.filter(
    (p) =>
      p.type === "after" &&
      compareKeys.includes(p.category) &&
      isImage(p.image_url)
  );

  const generalPhotos = photos.filter(
    (p) =>
      p.type === "after" && // ✅ ES AFTER
      areaKeys.includes(p.category) && // ✅ SOLO ÁREAS
      !compareKeys.includes(p.category) && // ✅ NO COMPARE
      isImage(p.image_url)
  );

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
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
          beforePhotos={beforePhotos}
          afterPhotos={afterPhotos}
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
