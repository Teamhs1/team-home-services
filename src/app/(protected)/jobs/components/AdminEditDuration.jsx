"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminEditDuration({ job, onUpdated }) {
  const [minutes, setMinutes] = useState(
    typeof job.duration_minutes === "number"
      ? String(job.duration_minutes)
      : "",
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const value = Number(minutes);

    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Invalid duration");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/jobs/update-duration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          minutes: value,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("⏱️ Duration updated");
      onUpdated(value);
      await onUpdated(value);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="number"
        min={1}
        step={1}
        className="border rounded-md p-2 w-full"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        placeholder="Minutes"
      />

      <Button className="w-full" onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
