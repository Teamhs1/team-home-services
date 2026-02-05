"use client";
import React from "react";

export default function JobTimer({ jobId, startedAt }) {
  const [startTime, setStartTime] = React.useState(
    startedAt ? new Date(startedAt) : null,
  );
  const [elapsed, setElapsed] = React.useState(0);

  // 🔁 fallback backend
  React.useEffect(() => {
    if (startTime || !jobId) return;

    (async () => {
      try {
        const res = await fetch(
          `/api/job-activity/last-start?job_id=${jobId}`,
          { cache: "no-store" },
        );
        const data = await res.json();

        const raw =
          data?.startTime ||
          data?.started_at ||
          data?.start_time ||
          data?.created_at;

        if (raw) setStartTime(new Date(raw));
      } catch (err) {
        console.error("JobTimer fetch error:", err);
      }
    })();
  }, [jobId, startTime]);

  // ⏱️ live tick
  React.useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  const hours = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="text-sm font-semibold text-blue-600 flex items-center gap-2">
      ⏱️ {hours}:{minutes}:{seconds}
    </div>
  );
}
