"use client";

import { Button } from "@/components/ui/button";
import JobTimer from "./JobTimer";
import JobDuration from "./JobDuration";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Dropdown
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { MoreVertical, Eye, RefreshCcw } from "lucide-react";

// FEATURES
import { FEATURE_ICONS } from "./job-upload/featureIcons";
import { FEATURES } from "./job-upload/features";

// 🔥 UNIT TYPE ICONS
import { UNIT_TYPE_ICONS } from "./job-upload/unitTypeIcons";

export function JobList({ jobs, openModal }) {
  const router = useRouter();

  if (!jobs?.length) {
    return (
      <div className="p-8 text-center text-gray-500">No jobs assigned yet.</div>
    );
  }

  /* ======================
     HELPERS
  ====================== */
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    return isNaN(d) ? "—" : d.toLocaleDateString();
  };

  const renderFeatureIcons = (features = []) =>
    features
      .filter((f) => FEATURE_ICONS[f])
      .slice(0, 3)
      .map((f) => {
        const Icon = FEATURE_ICONS[f];
        const label =
          FEATURES.find((x) => x.key === f)?.label || f.replaceAll("_", " ");

        return (
          <span
            key={f}
            className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded-full text-[10px]"
          >
            <Icon className="w-3 h-3 text-primary" />
            {label}
          </span>
        );
      });

  // 🔥 UNIT TYPE BADGE (mobile)
  const renderUnitTypeBadge = (unitType) => {
    if (!unitType) return null;

    const Icon = UNIT_TYPE_ICONS[unitType.toLowerCase()];

    return (
      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0">
        {Icon && <Icon className="w-3 h-3" />}
        {unitType}
      </span>
    );
  };

  /* ======================
     MOBILE — CARDS
  ====================== */
  return (
    <div className="w-full space-y-6">
      <div className="sm:hidden space-y-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            onClick={() => router.push(`/jobs/${job.id}`)}
            className="w-full px-3 py-2.5 bg-white border rounded-xl shadow-sm cursor-pointer"
          >
            {/* TITLE + UNIT TYPE + STATUS */}
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-base truncate flex-1">
                {job.title}
              </h3>

              {job.unit_type && renderUnitTypeBadge(job.unit_type)}

              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  job.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : job.status === "in_progress"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {job.status.replace("_", " ")}
              </span>
            </div>

            <p className="text-[13px] text-gray-500 leading-tight">
              {job.service_type} • {formatDate(job.scheduled_date)}
            </p>

            {job.features?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {renderFeatureIcons(job.features)}
              </div>
            )}

            {job.status === "in_progress" && <JobTimer jobId={job.id} />}
            {job.status === "completed" && <JobDuration jobId={job.id} />}

            {/* ACTIONS */}
            <div className="mt-2">
              {job.status === "pending" && (
                <Button
                  size="sm"
                  className="w-full"
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
                  className="w-full"
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

      {/* ======================
         DESKTOP — TABLE (UNCHANGED)
      ====================== */}
      <div className="hidden sm:block overflow-x-auto bg-white border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Job</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Features</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={(e) => {
                  const tag = e.target.tagName.toLowerCase();
                  if (["button", "svg", "path"].includes(tag)) return;
                  router.push(`/jobs/${job.id}`);
                }}
              >
                <td className="px-4 py-2 font-medium">{job.title}</td>
                <td className="px-4 py-2">{formatDate(job.scheduled_date)}</td>
                <td className="px-4 py-2">{job.service_type}</td>

                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {job.features?.length
                      ? renderFeatureIcons(job.features)
                      : "—"}
                  </div>
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

                  {job.status === "in_progress" && <JobTimer jobId={job.id} />}
                  {job.status === "completed" && <JobDuration jobId={job.id} />}
                </td>

                <td
                  className="px-4 py-2 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
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

                      {job.status === "pending" && (
                        <DropdownMenuItem
                          onClick={() => openModal(job.id, "before")}
                        >
                          Start job
                        </DropdownMenuItem>
                      )}

                      {job.status === "in_progress" && (
                        <DropdownMenuItem
                          onClick={() => openModal(job.id, "after")}
                        >
                          Complete job
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() =>
                          toast.info("Reset not enabled for staff yet")
                        }
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Reset
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
