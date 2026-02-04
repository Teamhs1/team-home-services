"use client";
import React from "react";

export default function JobDuration({ jobId, refreshKey = 0 }) {
  const [duration, setDuration] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/job-activity/last-duration?job_id=${jobId}`,
          { cache: "no-store" }, // 🔥 CLAVE
        );

        const data = await res.json();

        if (!cancelled && typeof data?.duration === "number") {
          setDuration(data.duration);
        }
      } catch (err) {
        console.error("Error loading duration:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId, refreshKey]); // 🔥 escucha refreshKey

  if (loading) {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-400">
        ⏳ Updating...
      </span>
    );
  }

  if (duration == null) return "—";

  const totalMinutes = Math.floor(duration / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="flex items-center gap-1 text-green-700 text-sm font-semibold">
      🕒 {hours > 0 && `${hours}h `}
      {minutes}min total
    </div>
  );
}
