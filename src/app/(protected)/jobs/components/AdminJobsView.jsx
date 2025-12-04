"use client";

import React, { useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSupabaseWithClerk } from "@/utils/supabase/useSupabaseWithClerk";
import {
  CalendarDays,
  User,
  LayoutGrid,
  List,
  MoreVertical,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import JobForm from "./JobForm";
import Slider from "@/components/Slider";
import JobDuration from "./JobDuration";
import JobTimer from "./JobTimer";
import { useSearchParams } from "next/navigation";

// ⭐ Dropdown menu imports
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function AdminJobsView({
  jobs,
  staffList,
  viewMode,
  setViewMode,
  fetchJobs,
  deleteJob,
}) {
  const { getClientWithToken } = useSupabaseWithClerk();

  // ⭐ STATUS FILTER
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  const filteredJobs =
    statusFilter === "all"
      ? jobs
      : jobs.filter((job) => job.status === statusFilter);

  // 🟦 FORZAR GRID EN MÓVIL
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      if (viewMode !== "grid") setViewMode("grid");
    }
  }, [viewMode, setViewMode]);

  // 🔹 Asignar staff
  const assignToStaff = async (jobId, assigned_to) => {
    try {
      const supabase = await getClientWithToken();
      const cleanValue = assigned_to?.trim() ? assigned_to : null;

      const { error } = await supabase
        .from("cleaning_jobs")
        .update({ assigned_to: cleanValue })
        .eq("id", jobId);

      if (error) throw new Error(error.message);
      toast.success("✅ Job assigned successfully!");
    } catch (err) {
      console.error("💥 Error assigning staff:", err);
      toast.error("Error assigning job: " + err.message);
    }
  };

  // 🧽 RESET JOB
  const resetJob = async (jobId) => {
    try {
      const supabase = await getClientWithToken();

      const { data: photos, error: fetchError } = await supabase
        .from("job_photos")
        .select("*")
        .eq("job_id", jobId);

      if (fetchError) throw fetchError;

      const filePaths = (photos || [])
        .map((p) => {
          const raw =
            p.file_path ||
            p.path ||
            p.photo_path ||
            p.storage_path ||
            p.url ||
            p.photo_url;

          if (!raw) return null;

          if (raw.startsWith("http")) {
            const clean = raw.split("/public/")[1];
            return clean || null;
          }

          return raw;
        })
        .filter(Boolean);

      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("job-photos")
          .remove(filePaths);

        if (storageError) throw storageError;
      }

      const { error: deleteError } = await supabase
        .from("job_photos")
        .delete()
        .eq("job_id", jobId);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from("cleaning_jobs")
        .update({
          status: "pending",
          start_time: null,
          end_time: null,
          completed_at: null,
          duration_minutes: null,
        })
        .eq("id", jobId);

      if (updateError) throw updateError;

      toast.success("⏳ Job reset successfully!");
      fetchJobs();
    } catch (err) {
      console.error("RESET ERROR:", err);
      toast.error("Error resetting job");
    }
  };

  return (
    <main className="px-4 sm:px-6 py-6 sm:py-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🧽 Jobs Management
        </h1>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="hidden sm:flex items-center gap-2"
        >
          {viewMode === "grid" ? (
            <List className="w-4 h-4" />
          ) : (
            <LayoutGrid className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* CREATE JOB */}
      <Card className="border shadow-md rounded-xl p-2 sm:p-4">
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
          <CardDescription>Add a new cleaning job.</CardDescription>
        </CardHeader>
        <CardContent>
          <JobForm staffList={staffList} fetchJobs={fetchJobs} />
        </CardContent>
      </Card>

      {/* LIST VIEW */}
      {viewMode === "list" ? (
        <div className="hidden sm:block bg-white shadow rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2">Job</th>
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Assigned</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-6 text-center text-gray-500">
                    No jobs available.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => {
                      const tag = e.target.tagName.toLowerCase();
                      if (
                        ["button", "select", "option", "svg", "path"].includes(
                          tag
                        )
                      )
                        return;
                      window.location.href = `/jobs/${job.id}`;
                    }}
                  >
                    <td className="px-4 py-2">{job.title}</td>
                    <td className="px-4 py-2">{job.property_address}</td>
                    <td className="px-4 py-2">{job.scheduled_date}</td>
                    <td className="px-4 py-2">{job.service_type}</td>

                    <td className="px-4 py-2">
                      <select
                        className="border rounded-md p-1 text-sm"
                        value={job.assigned_to || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          assignToStaff(job.id, e.target.value || null)
                        }
                      >
                        <option value="">Unassigned</option>
                        {staffList.map((staff) => (
                          <option key={staff.id} value={staff.clerk_id}>
                            {staff.full_name || staff.email}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-semibold ${
                          job.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : job.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {job.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-2">
                      {job.status === "in_progress" && (
                        <JobTimer jobId={job.id} status="in_progress" />
                      )}
                      {job.status === "completed" && (
                        <JobDuration jobId={job.id} status="completed" />
                      )}
                      {job.status === "pending" && "—"}
                    </td>

                    {/* ⭐ ACTIONS DROPDOWN */}
                    <td className="px-4 py-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              resetJob(job.id);
                            }}
                          >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Reset Job
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteJob(job.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              className="relative border shadow-sm rounded-2xl"
            >
              <div
                className="relative aspect-video bg-gray-100 cursor-pointer"
                onClick={() => (window.location.href = `/jobs/${job.id}`)}
              >
                <Slider jobId={job.id} mini />
              </div>

              <CardHeader className="pb-1">
                <CardTitle className="truncate text-lg">{job.title}</CardTitle>
                <CardDescription className="text-xs text-gray-500 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {job.scheduled_date || "No date"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-1">
                <p className="text-sm">
                  <strong>Type:</strong> {job.service_type}
                </p>

                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <select
                    className="border rounded-md p-1 text-xs flex-1"
                    value={job.assigned_to || ""}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      assignToStaff(job.id, e.target.value || null)
                    }
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.clerk_id}>
                        {staff.full_name || staff.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  {job.status === "in_progress" && (
                    <div className="bg-blue-50 text-blue-700 text-xs inline-block px-3 py-1 rounded-full shadow-sm">
                      <JobTimer jobId={job.id} />
                    </div>
                  )}

                  {job.status === "completed" && (
                    <div className="flex flex-col text-xs text-green-700">
                      <div className="bg-green-50 px-3 py-1 inline-block font-semibold rounded-full shadow-sm">
                        <JobDuration jobId={job.id} />
                      </div>
                      <span className="text-gray-500 text-[11px]">
                        Done on{" "}
                        {job.completed_at
                          ? new Date(job.completed_at).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  )}
                </div>

                {/* ⭐ DROPDOWN GRID */}
                <div className="pt-1 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          resetJob(job.id);
                        }}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Reset Job
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteJob(job.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
