"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, ClipboardList, CalendarDays } from "lucide-react";
import JobForm from "./JobForm";
import JobPhotos from "./JobPhotos";
import PhotoLogTable from "./PhotoLogTable";
import { toast } from "sonner";

export default function AdminJobsView({
  jobs,
  staffList,
  viewMode,
  setViewMode,
  fetchJobs,
  getToken,
  updateStatus,
  deleteJob,
}) {
  // 🔹 Asignar staff a un trabajo
  const assignToStaff = async (jobId, assigned_to) => {
    try {
      const token = await getToken({ template: "supabase" });

      const res = await fetch("/api/jobs/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: jobId, assigned_to }),
      });

      if (!res.ok) throw new Error("Failed to assign staff");

      toast.success("✅ Job assigned successfully!");
      // ⚡ No se necesita fetchJobs(); Realtime manejará la actualización
    } catch (err) {
      console.error("❌ Error assigning staff:", err.message);
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
      </div>

      {/* 🧾 Crear nuevo trabajo */}
      <Card className="border border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
          <CardDescription>Add a new cleaning job.</CardDescription>
        </CardHeader>
        <CardContent>
          <JobForm
            staffList={staffList}
            getToken={getToken}
            fetchJobs={fetchJobs} // ✅ Agregamos la función que usa JobForm
          />
        </CardContent>
      </Card>

      {/* 👁️ Render dinámico según viewMode */}
      {viewMode === "list" ? (
        // 🔹 Vista en tabla
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
                    <td className="px-4 py-2">{job.service_type}</td>

                    {/* 🔹 Selector de staff */}
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

                    {/* 🔹 Estado con colores consistentes */}
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
                      >
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
        // 🔹 Vista en grid (tarjetas)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {jobs.length === 0 ? (
            <p className="text-gray-500 italic">No jobs available.</p>
          ) : (
            jobs.map((job) => (
              <Card
                key={job.id}
                className="hover:shadow-lg border border-border/50 relative"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    {job.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    <CalendarDays className="w-4 h-4 inline mr-1" />
                    {job.scheduled_date} • {job.service_type}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-3">
                  {/* 📸 Fotos y logs */}
                  <JobPhotos jobId={job.id} readOnly />
                  <PhotoLogTable jobId={job.id} />

                  {/* 👷 Asignar staff */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Assigned To
                    </label>
                    <select
                      className="w-full border rounded-md p-1 text-sm"
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
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        job.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : job.status === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {job.status.replace("_", " ")}
                    </span>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteJob(job.id)}
                    >
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
