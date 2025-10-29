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

export default function StaffJobsView({
  jobs,
  viewMode,
  setViewMode,
  updateStatus,
}) {
  return (
    <main className="px-6 py-10 max-w-[1600px] mx-auto space-y-10">
      {/* 🔹 Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🧽 My Jobs
        </h1>
      </div>

      {/* 👁️ Vista dinámica según viewMode */}
      {viewMode === "list" ? (
        // 🔹 Vista en tabla
        <div className="overflow-x-auto bg-white shadow rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Job</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{job.title}</td>
                  <td className="px-4 py-2">
                    {new Date(job.scheduled_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{job.service_type}</td>
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

                  <td className="px-4 py-2 text-right space-x-2">
                    {job.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(job.id, "in_progress")}
                      >
                        Start
                      </Button>
                    )}
                    {job.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(job.id, "completed")}
                      >
                        Complete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // 🔹 Vista en grid (tarjetas)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {jobs.map((job) => (
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

              <CardContent>
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

                  {job.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(job.id, "in_progress")}
                    >
                      Start
                    </Button>
                  )}
                  {job.status === "in_progress" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(job.id, "completed")}
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
    </main>
  );
}
