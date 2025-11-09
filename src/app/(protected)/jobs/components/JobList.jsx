"use client";
import { Button } from "@/components/ui/button";
import JobTimer from "./JobTimer";
import JobDuration from "./JobDuration";

export function JobList({ jobs, openModal }) {
  if (!jobs?.length)
    return (
      <div className="p-8 text-center text-gray-500">No jobs assigned yet.</div>
    );

  return (
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
            <tr
              key={job.id}
              className="border-t hover:bg-gray-50 transition-colors"
            >
              {/* 🧾 Job title */}
              <td className="px-4 py-2 font-medium">{job.title}</td>

              {/* 📅 Scheduled date */}
              <td className="px-4 py-2">
                {job.scheduled_date
                  ? new Date(job.scheduled_date).toLocaleDateString()
                  : "—"}
              </td>

              {/* 🧰 Service type */}
              <td className="px-4 py-2">{job.service_type || "—"}</td>

              {/* 🔹 Status + timer/duration */}
              <td className="px-4 py-2">
                <div className="flex flex-col items-start gap-1">
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

                  {/* ⏱️ Contador en tiempo real */}
                  {job.status === "in_progress" && <JobTimer jobId={job.id} />}

                  {/* 🕒 Duración total al completar */}
                  {job.status === "completed" && <JobDuration jobId={job.id} />}
                </div>
              </td>

              {/* ⚙️ Actions */}
              <td className="px-4 py-2 text-right space-x-2">
                {job.status === "pending" && (
                  <Button size="sm" onClick={() => openModal(job.id, "before")}>
                    Start
                  </Button>
                )}
                {job.status === "in_progress" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openModal(job.id, "after")}
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
  );
}
