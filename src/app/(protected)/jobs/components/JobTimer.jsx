"use client";
import React from "react";

export default function JobTimer({ jobId }) {
  const [elapsed, setElapsed] = React.useState(0);
  const [startTime, setStartTime] = React.useState(null);

  React.useEffect(() => {
    if (!jobId) return;

    (async () => {
      try {
        const res = await fetch(`/api/job-activity/last-start?job_id=${jobId}`);
        const data = await res.json();
        if (data.startTime) setStartTime(new Date(data.startTime));
      } catch (err) {
        console.error("Error:", err);
      }
    })();
  }, [jobId]);

  React.useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsed(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  const hours = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="mt-1 text-lg font-normal text-blue-600 flex items-center gap-2">
      ⏱️ {hours}:{minutes}:{seconds}
    </div>
  );
}
