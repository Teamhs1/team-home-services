"use client";
import { Button } from "@/components/ui/button";
import JobTimer from "./JobTimer";
import JobDuration from "./JobDuration";
import { useRouter } from "next/navigation";

export function JobList({ jobs, openModal }) {
  const router = useRouter();

  if (!jobs?.length)
    return (
      <div className="p-8 text-center text-gray-500">No jobs assigned yet.</div>
    );

  // Helper para manejar fechas sin errores
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString();
  };

  return (
    <div className="w-full space-y-6">
      {/* ====================================== */}
      {/* 🔹 MOBILE VERSION — CARDS (NO TABLE)  */}
      {/* ====================================== */}
      <div className="sm:hidden space-y-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            onClick={() => router.push(`/jobs/${job.id}`)}
            className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm 
                       hover:shadow-md transition cursor-pointer"
          >
            <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>

            {/* Scheduled date + type */}
            <p className="text-sm text-gray-500 mt-1">
              {job.service_type} • {formatDate(job.scheduled_date)}
            </p>

            <div className="mt-3 space-y-2">
              {/* STATUS BADGE */}
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold inline-block w-fit ${
                  job.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : job.status === "in_progress"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {job.status.replace("_", " ")}
              </span>

              {/* IN PROGRESS */}
              {job.status === "in_progress" && (
                <div className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1 rounded-lg w-fit">
                  <JobTimer jobId={job.id} />
                </div>
              )}

              {/* COMPLETED */}
              {job.status === "completed" && (
                <div className="flex flex-col bg-green-50 text-green-700 text-sm font-semibold px-3 py-1 rounded-lg w-fit">
                  <JobDuration jobId={job.id} />

                  <span className="text-xs text-gray-500 mt-1">
                    Completed on {formatDate(job.completed_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="mt-4 flex justify-end gap-2">
              {job.status === "pending" && (
                <Button
                  size="sm"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(job.id, "after");
                  }}
                >
                  Complete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ====================================== */}
      {/* 🔹 DESKTOP VERSION — TABLE            */}
      {/* ====================================== */}
      <div className="hidden sm:block overflow-x-auto bg-white shadow rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Job</th>
              <th className="px-4 py-2 text-left">Scheduled Date</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="border-t hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={(e) => {
                  const tag = e.target.tagName.toLowerCase();
                  if (["button", "svg", "path"].includes(tag)) return;
                  router.push(`/jobs/${job.id}`);
                }}
              >
                <td className="px-4 py-2 font-medium">{job.title}</td>

                {/* Scheduled date */}
                <td className="px-4 py-2">{formatDate(job.scheduled_date)}</td>

                <td className="px-4 py-2">{job.service_type || "—"}</td>

                <td className="px-4 py-2">
                  <div className="flex flex-col gap-1">
                    {/* STATUS BADGE */}
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

                    {/* IN PROGRESS */}
                    {job.status === "in_progress" && (
                      <JobTimer jobId={job.id} />
                    )}

                    {/* COMPLETED */}
                    {job.status === "completed" && (
                      <div className="flex flex-col text-xs">
                        <JobDuration jobId={job.id} />

                        <span className="text-gray-500">
                          Completed on {formatDate(job.completed_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-4 py-2 text-right space-x-2">
                  {job.status === "pending" && (
                    <Button
                      size="sm"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(job.id, "after");
                      }}
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
    </div>
  );
}
