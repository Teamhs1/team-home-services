"use client";
import React from "react";

export default function JobTimer({ jobId }) {
  const [elapsed, setElapsed] = React.useState(0);
  const [startTime, setStartTime] = React.useState(null);

  // 🔹 Obtener la última hora de inicio
  React.useEffect(() => {
    if (!jobId) return;

    (async () => {
      try {
        const res = await fetch(`/api/job-activity/last-start?job_id=${jobId}`);
        const data = await res.json();
        if (data.startTime) setStartTime(new Date(data.startTime));
      } catch (err) {
        console.error("Error fetching start time:", err);
      }
    })();
  }, [jobId]);

  // 🔁 Actualiza el contador cada segundo
  React.useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsed(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  // ⏱️ Formato hh:mm:ss
  const hours = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="mt-1 text-xs font-semibold text-blue-600 flex items-center gap-1">
      ⏱️ {hours}:{minutes}:{seconds}
    </div>
  );
}
