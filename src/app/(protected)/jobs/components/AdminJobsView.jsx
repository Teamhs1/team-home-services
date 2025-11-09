"use client";

import React from "react";
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
import Slider from "@/components/Slider"; // ✅ Tu slider completo

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

  // 🔹 Asignar staff a un trabajo
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
    <main className="px-6 py-10 max-w-[1600px] mx-auto space-y-10">
      {/* 🔹 Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🧽 Jobs Management
        </h1>

        {/* 🔘 Botón de cambio de vista (list/grid) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="flex items-center gap-2"
          title={`Switch to ${viewMode === "grid" ? "List" : "Grid"} View`}
        >
          {viewMode === "grid" ? (
            <List className="w-4 h-4" />
          ) : (
            <LayoutGrid className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* 🧾 Crear nuevo trabajo */}
      <Card className="border border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
          <CardDescription>Add a new cleaning job.</CardDescription>
        </CardHeader>
        <CardContent>
          <JobForm staffList={staffList} fetchJobs={fetchJobs} />
        </CardContent>
      </Card>

      {/* 👁️ Vista list o grid */}
      {viewMode === "list" ? (
        <div className="overflow-x-auto bg-white shadow rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Job</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Assigned To</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No jobs available.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-2 font-medium">{job.title}</td>
                    <td className="px-4 py-2">{job.scheduled_date}</td>
                    <td className="px-4 py-2 capitalize">{job.service_type}</td>
                    <td className="px-4 py-2">
                      <select
                        className="border rounded-md p-1 text-sm"
                        value={job.assigned_to || ""}
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
                    <td className="px-4 py-2 text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteJob(job.id)}
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
        // 🌟 GRID VIEW con SLIDER clickable SOLO en el slider
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {jobs.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 italic">
              No jobs available.
            </p>
          ) : (
            jobs.map((job) => (
              <Card
                key={job.id}
                className="border shadow-sm hover:shadow-md transition-all overflow-hidden rounded-xl bg-white"
              >
                {/* 🖼️ Slider clickable */}
                <div
                  className="cursor-pointer aspect-video bg-gray-100"
                  onClick={() => (window.location.href = `/jobs/${job.id}`)}
                >
                  <Slider jobId={job.id} mini />
                </div>

                {/* 🧱 Info */}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold truncate">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-xs text-gray-500">
                    <CalendarDays className="w-3 h-3" />
                    {job.scheduled_date || "No date"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm capitalize text-gray-700">
                    <strong>Type:</strong> {job.service_type || "standard"}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="w-4 h-4" />
                    <select
                      className="border rounded-md p-1 text-xs flex-1"
                      value={job.assigned_to || ""}
                      onClick={(e) => e.stopPropagation()} // evita que abra el enlace
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

                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      job.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : job.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {job.status.replace("_", " ")}
                  </span>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation(); // evita navegar
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
