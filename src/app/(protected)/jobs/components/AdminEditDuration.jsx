"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminEditDuration({ job, onUpdated }) {
  const [minutes, setMinutes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof job?.duration_minutes === "number") {
      setMinutes(String(job.duration_minutes));
    } else {
      setMinutes("");
    }
  }, [job]);

  const save = async () => {
    const value = Number(minutes);

    if (!Number.isFinite(value) || value < 0) {
      toast.error("Invalid duration");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/jobs/save-duration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          minutes: value,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed to update duration");
      }

      toast.success("⏱️ Duration updated");
      onUpdated?.(value); // 🔥 UI inmediata
    } catch (err) {
      toast.error(err.message || "Error updating duration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="number"
        min={0}
        step={1}
        className="border rounded-md p-2 w-full"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        disabled={saving}
      />

      <Button className="w-full" onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
