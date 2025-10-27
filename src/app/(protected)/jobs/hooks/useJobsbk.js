"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

export function useJobs({ clerkId, role, getToken }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // 🔹 Cargar trabajos iniciales
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from("cleaning_jobs").select("*");
      if (role !== "admin") {
        query = query.or(`created_by.eq.${clerkId},assigned_to.eq.${clerkId}`);
      }
      const { data, error } = await query.order("scheduled_date", {
        ascending: true,
      });
      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      toast.error("Error loading jobs");
    } finally {
      setLoading(false);
    }
  }, [clerkId, role]);

  // 🔹 Suscripción Realtime mejorada + deduplicación
  const subscribeToRealtime = useCallback(() => {
    const channel = supabase
      .channel("realtime:cleaning_jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleaning_jobs" },
        (payload) => {
          console.log("📡 Realtime event:", payload);

          setJobs((prev) => {
            let updated = [...prev];

            // 🆕 INSERT — nuevo job creado
            if (payload.eventType === "INSERT") {
              const belongsToUser =
                payload.new.created_by === clerkId ||
                payload.new.assigned_to === clerkId ||
                role === "admin";
              if (belongsToUser) {
                toast.success(`🧽 New job created: ${payload.new.title}`);
                updated = [payload.new, ...updated];
              }
            }

            // 🔄 UPDATE — job actualizado o asignado
            if (payload.eventType === "UPDATE") {
              const exists = updated.some((j) => j.id === payload.new.id);
              const belongsToUser =
                payload.new.created_by === clerkId ||
                payload.new.assigned_to === clerkId ||
                role === "admin";

              // 🔔 Notificación cuando te asignan un nuevo trabajo
              if (
                payload.new.assigned_to === clerkId &&
                payload.old.assigned_to !== clerkId
              ) {
                toast.success(`🧽 New job assigned: ${payload.new.title}`);
              }

              if (exists) {
                updated = updated.map((j) =>
                  j.id === payload.new.id ? payload.new : j
                );
              } else if (belongsToUser) {
                updated = [payload.new, ...updated];
              }
            }

            // 🗑 DELETE — eliminar job de la lista
            if (payload.eventType === "DELETE") {
              updated = updated.filter((j) => j.id !== payload.old.id);
            }

            // ✅ Eliminar duplicados por id
            const unique = Array.from(
              new Map(updated.map((j) => [j.id, j])).values()
            );

            return unique;
          });
        }
      )
      .subscribe();

    return channel;
  }, [clerkId, role]);

  // 🔹 Actualizar estado del Job (optimista + realtime)
  const updateStatus = async (id, newStatus) => {
    if (updatingId) return;
    setUpdatingId(id);

    // ✅ Optimismo: cambia en la UI de inmediato
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, status: newStatus } : job))
    );

    try {
      const token = await getToken({ template: "supabase" });
      const res = await fetch("/api/jobs/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Job updated to "${newStatus}"`);
    } catch (err) {
      toast.error(err.message);
      fetchJobs(); // revertir si falla
    } finally {
      setUpdatingId(null);
    }
  };

  // 🔹 Eliminar trabajo
  const deleteJob = async (id) => {
    if (!confirm("Delete this job?")) return;
    try {
      const token = await getToken({ template: "supabase" });
      const res = await fetch("/api/jobs/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Job deleted successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // 🔹 Cargar y suscribirse
  useEffect(() => {
    if (!clerkId) return;
    fetchJobs();
    const channel = subscribeToRealtime();
    return () => supabase.removeChannel(channel);
  }, [clerkId, role, fetchJobs, subscribeToRealtime]);

  return {
    jobs,
    loading,
    fetchJobs,
    subscribeToRealtime,
    updateStatus,
    deleteJob,
  };
}
