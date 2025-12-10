"use client";

import React, { useEffect, useState } from "react";
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

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function AdminJobsView({
  jobs,
  staffList,
  clientList,
  viewMode,
  setViewMode,
  fetchJobs,
  deleteJob,
}) {
  const { getClientWithToken } = useSupabaseWithClerk();

  // LOAD CLIENTS
  const [loadedClients, setLoadedClients] = useState([]);

  useEffect(() => {
    async function fetchClients() {
      try {
        const supabase = await getClientWithToken();
        const { data, error } = await supabase
          .from("profiles")
          .select("id, clerk_id, full_name, email, role")
          .eq("role", "client");

        if (error) throw error;
        setLoadedClients(data || []);
      } catch (err) {
        console.error("❌ Error fetching clients:", err);
        toast.error("Could not load clients.");
      }
    }
    fetchClients();
  }, [getClientWithToken]);

  // STATUS FILTER
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  const filteredJobs =
    statusFilter === "all"
      ? jobs
      : jobs.filter((job) => job.status === statusFilter);

  // ⭐ DATE FILTER (ALL / WEEK / MONTH)
  const [dateFilter, setDateFilter] = useState("all");

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const dateFilteredJobs = filteredJobs.filter((job) => {
    if (!job.scheduled_date) return false;

    const jobDate = new Date(job.scheduled_date);

    if (dateFilter === "week") return jobDate >= startOfWeek;
    if (dateFilter === "month") return jobDate >= startOfMonth;

    return true;
  });

  // ⭐ NEW: CLIENT FILTER
  const [clientFilter, setClientFilter] = useState("all");
  // ⭐ NEW: STAFF FILTER
  const [staffFilter, setStaffFilter] = useState("all");

  // ⭐ APPLY CLIENT + STAFF FILTERS
  const finalFilteredJobs = dateFilteredJobs
    // filter by client
    .filter((job) => {
      if (clientFilter === "all") return true;
      return job.assigned_client === clientFilter;
    })
    // filter by staff
    .filter((job) => {
      if (staffFilter === "all") return true;
      if (staffFilter === "unassigned") return !job.assigned_to;
      return job.assigned_to === staffFilter;
    });

  // FORCE GRID ON MOBILE
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      if (viewMode !== "grid") setViewMode("grid");
    }
  }, [viewMode, setViewMode]);

  // ASSIGN STAFF
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
      toast.error("Error assigning job: " + err.message);
    }
  };

  // ASSIGN CLIENT
  const assignToClient = async (jobId, client_id) => {
    try {
      const supabase = await getClientWithToken();
      const cleanValue = client_id?.trim() ? client_id : null;

      const { error } = await supabase
        .from("cleaning_jobs")
        .update({ assigned_client: cleanValue })
        .eq("id", jobId);

      if (error) throw new Error(error.message);

      toast.success("✅ Cliente asignado correctamente!");
      fetchJobs();
    } catch (err) {
      toast.error("Error assigning client: " + err.message);
    }
  };

  // RESET JOB
  const resetJob = async (jobId) => {
    try {
      const supabase = await getClientWithToken();
      const { data: photos } = await supabase
        .from("job_photos")
        .select("*")
        .eq("job_id", jobId);

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
        await supabase.storage.from("job-photos").remove(filePaths);
      }

      await supabase.from("job_photos").delete().eq("job_id", jobId);

      await supabase
        .from("cleaning_jobs")
        .update({
          status: "pending",
          start_time: null,
          end_time: null,
          completed_at: null,
          duration_minutes: null,
        })
        .eq("id", jobId);

      toast.success("⏳ Job reset successfully!");
      fetchJobs();
    } catch (err) {
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

        <div className="flex items-center gap-3">
          {/* ⭐ DATE FILTER */}
          <select
            className="border rounded-md p-2 text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Jobs</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          {/* ⭐ STAFF FILTER */}
          <select
            className="border rounded-md p-2 text-sm"
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
          >
            <option value="all">All Staff</option>
            <option value="unassigned">Unassigned</option>

            {staffList.map((s) => (
              <option key={s.clerk_id} value={s.clerk_id}>
                {s.full_name ? s.full_name : s.email}
              </option>
            ))}
          </select>

          {/* ⭐ NEW CLIENT FILTER */}
          <select
            className="border rounded-md p-2 text-sm"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            <option value="all">All Clients</option>
            {loadedClients.map((c) => (
              <option key={c.clerk_id} value={c.clerk_id}>
                {c.full_name ? c.full_name : c.email}
              </option>
            ))}
          </select>

          {/* VIEW MODE BUTTON */}
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
      </div>

      {/* CREATE JOB */}
      <Card className="border shadow-md rounded-xl p-2 sm:p-4">
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
          <CardDescription>Add a new cleaning job.</CardDescription>
        </CardHeader>
        <CardContent>
          <JobForm
            staffList={staffList}
            clientList={loadedClients}
            fetchJobs={fetchJobs}
          />
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
                <th className="px-4 py-2">Staff</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {finalFilteredJobs.map((job) => (
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

                  {/* STAFF */}
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

                  {/* CLIENT */}
                  <td className="px-4 py-2">
                    <select
                      className="border rounded-md p-1 text-sm"
                      value={job.assigned_client || ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        assignToClient(job.id, e.target.value || null)
                      }
                    >
                      <option value="">No client assigned</option>
                      {loadedClients.map((client) => (
                        <option key={client.id} value={client.clerk_id}>
                          {client.full_name || client.email}
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
                      <JobTimer jobId={job.id} />
                    )}
                    {job.status === "completed" && (
                      <JobDuration jobId={job.id} />
                    )}
                    {job.status === "pending" && "—"}
                  </td>

                  {/* ACTIONS */}
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
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {finalFilteredJobs.map((job) => (
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

                {/* STAFF */}
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

                {/* CLIENT */}
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <select
                    className="border rounded-md p-1 text-xs flex-1"
                    value={job.assigned_client || ""}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      assignToClient(job.id, e.target.value || null)
                    }
                  >
                    <option value="">No client</option>
                    {loadedClients.map((client) => (
                      <option key={client.id} value={client.clerk_id}>
                        {client.full_name || client.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* STATUS */}
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

                {/* ACTIONS */}
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
