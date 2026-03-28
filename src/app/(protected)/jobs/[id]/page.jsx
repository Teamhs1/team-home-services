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
  // 📸 PHOTOS
  // ===============================
  const refreshPhotos = async () => {
    const res = await fetch(`/api/job-photos/list?job_id=${id}`);
    const result = await res.json();

    const grouped = result.data || { before: [], after: [], general: [] };
    setPhotos([...grouped.before, ...grouped.after, ...grouped.general]);
  };
  // ===============================

  const handleReopen = () => {
    setJob((prev) =>
      prev
        ? {
            ...prev,
            status: "pending",
            completed_at: null,
          }
        : prev,
    );
  };
  const handleComplete = () => {
    setJob((prev) =>
      prev
        ? {
            ...prev,
            status: "completed",
            completed_at: new Date().toISOString(),
          }
        : prev,
    );
  };
  const handleStart = () => {
    setJob((prev) =>
      prev
        ? {
            ...prev,
            status: "in_progress",
            started_at: new Date().toISOString(),
          }
        : prev,
    );
  };
  // 🔥 ACTUALIZAR JOB LOCAL DESDE EL MODAL
  const updateLocalJob = (jobId, patch) => {
    setJob((prev) =>
      prev && prev.id === jobId
        ? {
            ...prev,
            ...patch,
          }
        : prev,
    );
  };

  // ===============================
  // 🔄 JOB
  // ===============================
  const refreshJobData = async () => {
    const res = await fetch(`/api/jobs/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      setJob(null);
      return;
    }

    const data = await res.json();
    setJob(data);
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

    const isHallway = job.service_type === "hallway_cleaning";

    const isLight = job.service_type === "light_cleaning";

    if (isHallway) {
      return [
        "floor_condition",
        "baseboards_condition",
        "walls_condition",
        "handrails_condition",
        "corners_condition",
        "lights_condition",
        "floor_cleaned",
        "baseboards_cleaned",
        "walls_cleaned",
        "handrails_cleaned",
        "final_overview",
      ];
    }

    // 🔥 LIGHT CLEANING
    if (isLight) {
      const keys = ["general_floor", "general_kitchen", "general_bathroom"];

      if (job.unit_type) {
        const match = job.unit_type.match(/\d+/);
        const count = match ? parseInt(match[0]) : 0;

        for (let i = 1; i <= count; i++) {
          keys.push(`room_${i}`);
        }
      }

      return keys;
    }

    // 🧽 DEEP CLEANING (default)
    return [
      ...staticCompare.map((c) => c.key),
      ...compareFromFeatures(job.features || []).map((c) => c.key),
    ];
  }, [job]);

  const areaKeys = useMemo(() => {
    if (!job) return [];
    return generalAreas(job.features || [], "after", job.unit_type).map(
      (a) => a.key,
    );
  }, [job]);

  const isImage = (url) => /\.(jpg|jpeg|png|webp|gif)$/i.test(publicUrl(url));

  // ===============================
  // 📸 FILTERS (FINAL)
  // ===============================
  const beforePhotos = photos.filter(
    (p) => p.type === "before" && isImage(p.image_url),
  );

  const afterPhotos = photos.filter(
    (p) =>
      p.type === "after" &&
      compareKeys.includes(p.category) &&
      isImage(p.image_url),
  );

  const generalPhotos = photos.filter(
    (p) =>
      p.type === "after" &&
      !compareKeys.includes(p.category) &&
      isImage(p.image_url),
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
        <JobHeader
          job={job}
          router={router}
          openModal={openModal}
          onTitleUpdated={(patch) =>
            setJob((prev) => ({
              ...prev,
              ...patch,
            }))
          }
          onReopen={refreshJobData}
          onStart={async (patch) => {
            setJob((prev) =>
              prev
                ? {
                    ...prev,
                    ...(patch || {}),
                    status: "in_progress",
                    started_at: patch?.started_at || new Date().toISOString(),
                  }
                : prev,
            );

            const token = await getToken({ template: "supabase" });

            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              {
                global: {
                  headers: { Authorization: `Bearer ${token}` },
                },
              },
            );

            await supabase
              .from("cleaning_jobs")
              .update({
                status: "in_progress",
                started_at: new Date().toISOString(),
              })
              .eq("id", id);
          }}
          onComplete={async (patch) => {
            const completedAt = new Date().toISOString();

            setJob((prev) =>
              prev
                ? {
                    ...prev,
                    ...(patch || {}),
                    status: "completed",
                    completed_at: completedAt,
                  }
                : prev,
            );

            const token = await getToken({ template: "supabase" });

            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              {
                global: {
                  headers: { Authorization: `Bearer ${token}` },
                },
              },
            );

            await supabase
              .from("cleaning_jobs")
              .update({
                status: "completed",
                completed_at: completedAt,
              })
              .eq("id", id);
          }}
        />

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
            type={modalType === "hallway_before" ? "before" : modalType}
            onClose={closeModal}
            updateLocalJob={updateLocalJob}
            updateStatus={async (jobId, newStatus) => {
              const token = await getToken({ template: "supabase" });

              const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                {
                  global: {
                    headers: { Authorization: `Bearer ${token}` },
                  },
                },
              );

              const payload =
                newStatus === "completed"
                  ? {
                      status: "completed",
                      completed_at: new Date().toISOString(),
                    }
                  : { status: newStatus };

              await supabase
                .from("cleaning_jobs")
                .update(payload)
                .eq("id", jobId);
            }}
            fetchJobs={() => {}}
          />
        )}
      </AnimatePresence>
    </>
  );
}
