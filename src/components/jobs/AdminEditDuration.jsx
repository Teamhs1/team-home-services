"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSupabaseWithClerk } from "@/utils/supabase/useSupabaseWithClerk";
import { Pencil, Check, X } from "lucide-react";

export default function AdminEditDuration({ job, onUpdated }) {
  const { getClientWithToken } = useSupabaseWithClerk();

  const initialMinutes = job.duration_minutes || 0;

  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState(Math.floor(initialMinutes / 60));
  const [minutes, setMinutes] = useState(initialMinutes % 60);
  const [loading, setLoading] = useState(false);

  // ⏱️ FORMAT (VIEW ONLY)
  const formatDuration = (total) => {
    if (total == null || isNaN(total)) return "—";
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h > 0 && m > 0) return `${h} h ${m} min`;
    if (h > 0) return `${h} h`;
    return `${m} min`;
  };

  const save = async () => {
    try {
      setLoading(true);
      const supabase = await getClientWithToken();

      const totalMinutes = Number(hours || 0) * 60 + Number(minutes || 0);

      const { error } = await supabase
        .from("cleaning_jobs")
        .update({
          duration_minutes: totalMinutes,
          duration_edited_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (error) throw error;

      toast.success("⏱️ Duration updated");

      onUpdated?.({
        ...job,
        duration_minutes: totalMinutes,
      });

      setEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("Error updating duration");
    } finally {
      setLoading(false);
    }
  };

  // 👀 VIEW MODE
  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold">{formatDuration(initialMinutes)}</span>

        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setEditing(true)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // ✏️ EDIT MODE (HOURS + MINUTES)
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min="0"
        placeholder="h"
        className="w-14 h-8"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
      />

      <span className="text-sm text-gray-500">h</span>

      <Input
        type="number"
        min="0"
        max="59"
        placeholder="min"
        className="w-16 h-8"
        value={minutes}
        onChange={(e) => setMinutes(Math.min(59, Math.max(0, e.target.value)))}
      />

      <span className="text-sm text-gray-500">min</span>

      <Button
        size="icon"
        variant="ghost"
        onClick={save}
        disabled={loading}
        className="h-7 w-7"
      >
        <Check className="w-4 h-4 text-green-600" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => {
          setHours(Math.floor(initialMinutes / 60));
          setMinutes(initialMinutes % 60);
          setEditing(false);
        }}
        className="h-7 w-7"
      >
        <X className="w-4 h-4 text-red-600" />
      </Button>
    </div>
  );
}
