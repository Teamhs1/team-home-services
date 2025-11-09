"use client";
import React from "react";

export default function JobDuration({ jobId }) {
  const [duration, setDuration] = React.useState(null);

  React.useEffect(() => {
    if (!jobId) return;

    (async () => {
      try {
        const res = await fetch(
          `/api/job-activity/last-duration?job_id=${jobId}`
        );
        const data = await res.json();
        if (data?.duration) setDuration(data.duration);
      } catch (err) {
        console.error("Error fetching duration:", err);
      }
    })();
  }, [jobId]);

  if (duration === null) return null;

  const totalMinutes = Math.floor(duration / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="mt-1 text-xs font-semibold text-green-600 flex items-center gap-1">
      🕒 {hours > 0 ? `${hours}h ` : ""}
      {minutes}min total
    </div>
  );
}
