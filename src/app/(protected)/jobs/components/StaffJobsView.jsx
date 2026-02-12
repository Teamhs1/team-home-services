"use client";
import { useAuth } from "@clerk/nextjs";

import {
  MoreVertical,
  RefreshCcw,
  Trash2,
  Eye,
  ClipboardList,
  LayoutGrid,
  List,
  CalendarDays,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { UNIT_TYPE_ICONS } from "./job-upload/unitTypeIcons";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import { JobList } from "./JobList";
import { JobUploadModal } from "./job-upload/JobUploadModal";
import JobTimer from "./JobTimer";
import JobDuration from "./JobDuration";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import Slider from "@/components/Slider";

// Feature Icons
import { FEATURE_ICONS } from "./job-upload/featureIcons";
import { FEATURES } from "./job-upload/features";

// Cards
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

const UNIT_TYPE_LABELS = {
  bachelor: "Bachelor",
  "1_bed": "1 Bed",
  "2_beds": "2 Beds",
  "3_beds": "3 Beds",
  "4_beds": "4 Beds",
  studio: "Studio",
  house: "House",
};

const getUnitTypeLabel = (key) => UNIT_TYPE_LABELS[key] || key;

export default function StaffJobsView({
  jobs: initialJobs,

  fetchJobs,
  viewMode,
  setViewMode,
}) {
  const { getToken } = useAuth(); // ✅ OBLIGATORIO

  const [jobs, setJobs] = useState(initialJobs || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);
  const [currentSlide, setCurrentSlide] = useState({});

  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  const STATUS_STYLES = {
    pending: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  // ===================================================
  // FILTER JOBS (debe estar antes del useEffect)
  // ===================================================
  const filteredJobs = (
    statusFilter === "all"
      ? jobs
      : statusFilter === "upcoming"
        ? jobs.filter((j) => new Date(j.scheduled_date) > new Date())
        : jobs.filter((j) => j.status === statusFilter)
  )
    .filter((job) => {
      if (!searchTerm) return true;

      const term = searchTerm.toLowerCase();

      return (
        job.title?.toLowerCase().includes(term) ||
        job.property_address?.toLowerCase().includes(term) ||
        job.service_type?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) =>
      a.title.localeCompare(b.title, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

  // ===================================================
  // 🔥 REAL PHOTO COUNTS (from API)
  // ===================================================
  const [photoCounts, setPhotoCounts] = useState({});

  useEffect(() => {
    if (!filteredJobs?.length) return;

    const loadCounts = async () => {
      const map = {};

      for (const job of filteredJobs) {
        try {
          const res = await fetch(`/api/job-photos/list?job_id=${job.id}`);
          const data = await res.json();

          const total =
            (data?.data?.before?.length || 0) +
            (data?.data?.after?.length || 0) +
            (data?.data?.general?.length || 0);

          map[job.id] = total;
        } catch {
          map[job.id] = 0;
        }
      }

      setPhotoCounts(map);
    };

    loadCounts();
  }, [filteredJobs]); // 👈 CORRECTO

  useEffect(() => {
    fetchStaffJobs();
  }, []);

  async function fetchStaffJobs() {
    try {
      const res = await fetch("/api/staff/jobs", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load staff jobs");
      }

      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assigned jobs");
    }
  }

  // ===================================================
  // Feature Icons renderer
  // ===================================================
  const renderFeatureIcons = (jobFeatures) => {
    if (!Array.isArray(jobFeatures)) return null;

    return jobFeatures
      .filter((f) => FEATURE_ICONS[f])
      .slice(0, 5)
      .map((f) => {
        const Icon = FEATURE_ICONS[f];
        const label =
          FEATURES.find((x) => x.key === f)?.label || f.replaceAll("_", " ");

        return (
          <div
            key={f}
            className="flex items-center gap-1 text-gray-700 dark:text-gray-300 
          bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-[10px] font-medium"
          >
            <Icon className="w-3 h-3 text-primary" />
            {label}
          </div>
        );
      });
  };
  const renderUnitTypeBadge = (unitType) => {
    if (!unitType) return null;

    const Icon = UNIT_TYPE_ICONS[unitType];

    return (
      <span
        className="
        inline-flex items-center gap-1
        bg-blue-50 text-blue-700
        px-2 py-0.5
        rounded-full
        text-[11px]
        font-semibold
      "
      >
        {Icon && <Icon className="w-3 h-3" />}
        {getUnitTypeLabel(unitType)}
      </span>
    );
  };

  // ===================================================
  // AUTO-FORZAR GRID EN MOBILE
  // ===================================================

  const openModal = (jobId, type) => {
    setModalType(type);
    setCurrentJob(jobId);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentJob(null);
    setModalType(null);
  };

  const updateLocalJob = (jobId, updates) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j)),
    );
  };
  const updateStatus = async (jobId, status) => {
    if (!jobId) {
      toast.error("Job ID missing in updateStatus");
      return;
    }

    const token = await getToken({ template: "supabase" });

    if (!token) {
      throw new Error("No auth token");
    }

    try {
      const res = await fetch("/api/jobs/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ CLAVE
        },
        body: JSON.stringify({
          id: jobId,
          status,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update job status");

      // 🔄 Update UI immediately
      updateLocalJob(jobId, {
        status,
        ...(status === "in_progress"
          ? { started_at: new Date().toISOString() }
          : {}),
        ...(status === "completed"
          ? { completed_at: new Date().toISOString() }
          : {}),
      });

      return json;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  // ===================================================
  // REALTIME UPDATES
  // ===================================================
  useEffect(() => {
    const supabaseRealtime = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );

    const channel = supabaseRealtime
      .channel("staff_jobs_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleaning_jobs" },
        async () => {
          await fetchJobs?.();
          toast.info("🔄 Job list updated in real-time");
        },
      )
      .subscribe();

    return () => supabaseRealtime.removeChannel(channel);
  }, [fetchJobs]);

  // ===================================================
  // VIEW TOGGLE
  // ===================================================
  const ViewToggleButton = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
      className="flex items-center gap-2"
    >
      {viewMode === "grid" ? (
        <List className="w-4 h-4" />
      ) : (
        <LayoutGrid className="w-4 h-4" />
      )}
    </Button>
  );

  return (
    <main className="pt-3 pb-6 sm:px-6 sm:py-10 max-w-[1600px] mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-1">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          My Jobs
        </h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="🔍 Search job or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
        w-full sm:w-56
        border rounded-full
        px-4 py-2 text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500
      "
          />

          <Button
            variant="outline"
            onClick={() => {
              fetchJobs?.();
              toast.info("Refreshing jobs list...");
            }}
          >
            Refresh
          </Button>

          <ViewToggleButton />
        </div>
      </div>

      {/* LIST / GRID */}
      {viewMode === "list" ? (
        <JobList jobs={filteredJobs} openModal={openModal} />
      ) : (
        <div
          className="
            grid 
            gap-4 sm:gap-6 
            place-items-stretch 
            grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
            auto-rows-auto
          "
        >
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              className="
    h-full flex flex-col
    relative border shadow-sm hover:shadow-md transition-all 
rounded-xl bg-white overflow-visible sm:overflow-hidden
    w-full sm:w-[90%] md:w-full
  "
            >
              {/* IMAGE */}
              <div
                className="cursor-pointer relative aspect-video bg-gray-100"
                onClick={() => router.push(`/jobs/${job.id}`)}
              >
                {/* ACTIONS MENU (3 DOTS) */}
                <div
                  className="absolute top-2 right-2 z-30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white/90 backdrop-blur shadow"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/jobs/${job.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View job
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() =>
                          toast.info("Reset not enabled for staff yet")
                        }
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Reset job
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => toast.error("Delete disabled for staff")}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* SLIDER */}
                <Slider
                  jobId={job.id}
                  mini
                  onSlideChange={(index) =>
                    setCurrentSlide((prev) => ({ ...prev, [job.id]: index }))
                  }
                />

                {/* PHOTO COUNT */}
                <div
                  className="
    absolute top-2 left-2 z-30 sm:hidden
    flex items-center gap-1
    bg-black/60 backdrop-blur
    text-white
    px-2 py-1
    rounded-full
    text-[11px]
    font-semibold
    shadow-sm
  "
                >
                  📷 {(currentSlide[job.id] ?? 0) + 1} /{" "}
                  {photoCounts[job.id] ?? 0}
                </div>

                {/* STATUS */}
                <span
                  className={`
    absolute bottom-2 left-2 z-20
    px-3 py-1
    rounded-full
    text-xs font-semibold capitalize
    shadow-sm
    ${STATUS_STYLES[job.status] || "bg-gray-100 text-gray-700"}
  `}
                >
                  {job.status.replace("_", " ")}
                </span>
              </div>

              {/* CONTENT */}
              <CardHeader className="pb-1 pt-2 sm:pt-6 space-y-1">
                <CardTitle className="text-lg font-semibold truncate">
                  {job.title}
                </CardTitle>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <CalendarDays className="w-3 h-3" />
                    {job.scheduled_date || "No date"}
                  </span>

                  {job.unit_type && renderUnitTypeBadge(job.unit_type)}
                </div>
              </CardHeader>

              <CardContent className="space-y-1 pt-1 pb-2 sm:pb-6">
                {/* TYPE */}
                <p className="text-sm capitalize text-gray-700">
                  <strong className="text-gray-800">Type:</strong>{" "}
                  {job.service_type}
                </p>

                {/* FEATURES */}
                {job.features?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {renderFeatureIcons(job.features)}
                  </div>
                )}

                {/* TIMER / DURATION */}
                <div className="w-full space-y-1">
                  {job.status === "in_progress" && (
                    <div
                      className="
        w-full sm:w-auto
        bg-blue-50 text-blue-700
        text-xs font-semibold
        px-3 py-2
        rounded-full shadow-sm
        text-center
      "
                    >
                      <JobTimer jobId={job.id} />
                    </div>
                  )}

                  {job.status === "completed" && (
                    <div className="flex flex-col text-xs text-green-700">
                      <div
                        className="
          w-full sm:w-auto
          bg-green-50 px-3 py-2
          font-semibold rounded-full shadow-sm
          text-center
        "
                      >
                        {job.duration_minutes != null ? (
                          <>⏱ {job.duration_minutes} min total</>
                        ) : (
                          <JobDuration jobId={job.id} />
                        )}
                      </div>

                      <span className="text-gray-500 text-[11px] text-center">
                        Done{" "}
                        {job.completed_at
                          ? new Date(job.completed_at).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div
                  className="
    pt-2
    flex
    sm:justify-end
    justify-stretch
  "
                >
                  {job.status === "pending" && (
                    <Button
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(job.id, "before");
                      }}
                    >
                      Start
                    </Button>
                  )}

                  {job.status === "in_progress" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(job.id, "after");
                      }}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {modalOpen && currentJob && (
          <JobUploadModal
            jobId={currentJob}
            type={modalType}
            onClose={handleCloseModal}
            updateStatus={updateStatus}
            fetchJobs={fetchJobs}
            updateLocalJob={updateLocalJob} // 👈 CLAVE
          />
        )}
      </AnimatePresence>
    </main>
  );
}
