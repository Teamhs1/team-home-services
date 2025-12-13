"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSupabaseWithClerk } from "@/utils/supabase/useSupabaseWithClerk";
import { Pencil, Check, X } from "lucide-react";

export default function AdminEditDuration({ job, onUpdated }) {
  const { getClientWithToken } = useSupabaseWithClerk();

  const [editing, setEditing] = useState(false);
  const [minutes, setMinutes] = useState(job.duration_minutes || 0);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    try {
      setLoading(true);
      const supabase = await getClientWithToken();

      const updatedMinutes = Number(minutes);

      const { error } = await supabase
        .from("cleaning_jobs")
        .update({
          duration_minutes: updatedMinutes,
          duration_edited_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (error) throw error;

      toast.success("⏱️ Duration updated");

      // 🔥 Notificar al padre
      onUpdated?.({
        ...job,
        duration_minutes: updatedMinutes,
      });

      setEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("Error updating duration");
    } finally {
      setLoading(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold">{`${minutes} min`}</span>

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

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min="0"
        className="w-20 h-8"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
      />

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
          setMinutes(job.duration_minutes || 0);
          setEditing(false);
        }}
        className="h-7 w-7"
      >
        <X className="w-4 h-4 text-red-600" />
      </Button>
    </div>
  );
}
