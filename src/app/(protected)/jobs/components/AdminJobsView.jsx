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
import { CalendarDays, User, Trash2, LayoutGrid, List } from "lucide-react";
import JobForm from "./JobForm";
import Slider from "@/components/Slider";
import JobDuration from "./JobDuration";
import JobTimer from "./JobTimer";
import Link from "next/link";

export default function AdminJobsView({
  jobs,
  staffList,
  viewMode,
  setViewMode,
  fetchJobs,
  updateStatus,
  deleteJob,
}) {
  const { getClientWithToken } = useSupabaseWithClerk();

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

  return (
    <main className="px-4 sm:px-6 py-6 sm:py-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🧽 Jobs Management
        </h1>

        {/* BOTÓN — OCULTO EN MÓVIL */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="hidden sm:flex items-center gap-2"
          title={`Switch to ${viewMode === "grid" ? "List" : "Grid"} View`}
        >
          {viewMode === "grid" ? (
            <List className="w-4 h-4" />
          ) : (
            <LayoutGrid className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* CREAR JOB */}
      <Card className="border border-border/50 shadow-md rounded-xl p-2 sm:p-4">
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
          <CardDescription>Add a new cleaning job.</CardDescription>
        </CardHeader>
        <CardContent>
          <JobForm staffList={staffList} fetchJobs={fetchJobs} />
        </CardContent>
      </Card>

      {/* VISTA LISTA (OCULTA EN MÓVILES) */}
      {viewMode === "list" ? (
        <div className="hidden sm:block overflow-x-auto bg-white shadow rounded-lg border border-gray-200 scrollbar-thin scrollbar-thumb-gray-300">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Job</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Assigned To</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Duration</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No jobs available.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-t hover:bg-gray-50 transition-colors cursor-pointer"
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
                    <td className="px-4 py-2 font-medium">{job.title}</td>
                    <td className="px-4 py-2">{job.scheduled_date}</td>
                    <td className="px-4 py-2 capitalize">{job.service_type}</td>
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
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
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
                        <div className="text-blue-600 font-semibold text-xs flex items-center gap-1">
                          <JobTimer jobId={job.id} status="in_progress" />
                        </div>
                      )}

                      {job.status === "completed" && (
                        <div className="text-green-600 font-semibold text-xs flex items-center gap-1">
                          <JobDuration jobId={job.id} status="completed" />
                        </div>
                      )}

                      {job.status === "pending" && (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-2 text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteJob(job.id);
                        }}
                        className="flex gap-1 items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // 🟦 GRID VIEW (ACTIVO EN MOBILE & DESKTOP)
        <div
          className="grid gap-4 sm:gap-6 
            grid-cols-1     /* 📱 Móvil SIEMPRE 1 columna */
            sm:grid-cols-1  /* 🟦 Tablets también 1 columna */
            md:grid-cols-2  /* 💻 Desktop pequeño: 2 columnas */
            lg:grid-cols-3 
            xl:grid-cols-4"
        >
          {jobs.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 italic">
              No jobs available.
            </p>
          ) : (
            jobs.map((job) => (
              <Card
                key={job.id}
                className="relative border shadow-sm hover:shadow-md transition-all rounded-2xl bg-white overflow-hidden"
              >
                {/* 🖼 Imagen + overlay info */}
                <div
                  className="cursor-pointer relative aspect-video bg-gray-100"
                  onClick={() => (window.location.href = `/jobs/${job.id}`)}
                >
                  <Slider jobId={job.id} mini />

                  {/* Badge de cantidad de fotos */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    {job.photo_count || 0} photos
                  </div>

                  {/* Estado sobre imagen */}
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm
        ${
          job.status === "pending"
            ? "bg-yellow-300/70 text-black"
            : job.status === "in_progress"
            ? "bg-blue-500/70 text-white"
            : "bg-green-500/70 text-white"
        }`}
                  >
                    {job.status.replace("_", " ")}
                  </span>
                </div>

                {/* 📝 Contenido */}
                <CardHeader className="pb-1">
                  <CardTitle className="text-lg font-semibold truncate">
                    {job.title}
                  </CardTitle>

                  <CardDescription className="flex items-center gap-2 text-xs text-gray-500">
                    <CalendarDays className="w-3 h-3" />
                    {job.scheduled_date || "No date"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-1">
                  {/* Tipo */}
                  <p className="text-sm capitalize text-gray-700">
                    <strong className="text-gray-800">Type:</strong>{" "}
                    {job.service_type}
                  </p>

                  {/* Staff */}
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="w-4 h-4 text-gray-500" />
                    <select
                      className="border rounded-md p-1 text-xs flex-1 focus:ring-primary focus:border-primary"
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

                  {/* Timer / Duración */}
                  <div>
                    {job.status === "in_progress" && (
                      <div className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                        <JobTimer jobId={job.id} />
                      </div>
                    )}

                    {job.status === "completed" && (
                      <div className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                        <JobDuration jobId={job.id} />
                      </div>
                    )}
                  </div>

                  {/* Botón Delete */}
                  <div className="pt-1 flex justify-end">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteJob(job.id);
                      }}
                      className="flex gap-1 items-center"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </main>
  );
}
