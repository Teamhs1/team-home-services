"use client";

import { useEffect, useState } from "react";

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return "0 min";

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h && m) return `${h}h ${m}min`;
  if (h) return `${h}h`;
  return `${m}min`;
}

export default function JobDuration({ jobId }) {
  const [minutes, setMinutes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!cancelled) {
          setMinutes(data.duration_minutes ?? null);
        }
      } catch (err) {
        console.error("JobDuration error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (loading) {
    return <span className="italic text-gray-400">Calculating…</span>;
  }

  if (minutes == null) {
    return <span className="italic text-gray-400">Calculating…</span>;
  }

  return (
    <span className="inline-flex items-center gap-1">
      ⏱️ {formatDuration(minutes)}
    </span>
  );
}
