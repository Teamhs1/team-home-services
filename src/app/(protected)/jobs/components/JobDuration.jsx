"use client";
import React from "react";

export default function JobDuration({ jobId }) {
  const [durationSeconds, setDurationSeconds] = React.useState(null);

  React.useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    (async () => {
      const res = await fetch(
        `/api/job-activity/last-duration?job_id=${jobId}`,
        { cache: "no-store" },
      );

      const data = await res.json();

      if (!cancelled && typeof data?.duration === "number") {
        setDurationSeconds(data.duration);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (durationSeconds == null) {
    return <span className="text-xs text-gray-400 italic">Calculating…</span>;
  }

  const totalMinutes = Math.floor(durationSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
      ⏱️ {hours > 0 && `${hours}h `}
      {minutes}min
    </span>
  );
}
