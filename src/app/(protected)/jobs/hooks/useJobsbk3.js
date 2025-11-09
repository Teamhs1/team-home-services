"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

/**
 * Hook central de Jobs autenticado con Clerk
 * - Compatible con políticas RLS
 * - Incluye Realtime y Broadcast
 */
export function useJobs({ clerkId, role, getToken }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // 🔹 Cargar trabajos iniciales autenticados
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Missing Clerk token");

      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
        }
      );

      let query = supabaseAuth.from("cleaning_jobs").select("*");
      if (role !== "admin") {
        query = query.or(`created_by.eq.${clerkId},assigned_to.eq.${clerkId}`);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error("❌ Error loading jobs:", err.message);
      toast.error("Error loading jobs: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [clerkId, role, getToken]);

  // 🔹 Suscripción Realtime + Broadcast
  const subscribeToRealtime = useCallback(
    async (supabaseRealtime) => {
      try {
        console.log(`📡 Subscribing to Realtime as ${role}`);

        const channelName =
          role === "admin"
            ? "realtime_jobs_admin_global"
            : `realtime_jobs_${role}`;

        const channel = supabaseRealtime.channel(channelName);

        // 🔸 Escucha cambios en la tabla (INSERT/UPDATE/DELETE)
        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "cleaning_jobs",
          },
          (payload) => {
            console.log(
              "📡 DB Event:",
              payload.eventType,
              payload.new || payload.old
            );

            setJobs((prev) => {
              let updated = [...prev];
              if (payload.eventType === "INSERT") {
                updated = [payload.new, ...updated];
              } else if (payload.eventType === "UPDATE") {
                updated = updated.map((j) =>
                  j.id === payload.new.id ? payload.new : j
                );
              } else if (payload.eventType === "DELETE") {
                updated = updated.filter((j) => j.id !== payload.old.id);
              }
              // elimina duplicados por id
              return Array.from(
                new Map(updated.map((j) => [j.id, j])).values()
              );
            });
          }
        );

        // 🔸 Solo admin escucha broadcasts globales
        if (role === "admin") {
          channel.on("broadcast", { event: "job_created" }, async (payload) => {
            console.log("📢 Broadcast recibido:", payload);
            toast.info("🧾 New job created by client");
            await fetchJobs(); // 🔁 Refresca lista
          });
        }

        // ✅ Suscribirse correctamente
        channel.subscribe((status) => {
          console.log(`📶 Realtime status [${role}]:`, status);
        });

        return channel;
      } catch (err) {
        console.error("❌ Error subscribing to realtime:", err.message);
        toast.error("Realtime connection failed");
        return null;
      }
    },
    [role, fetchJobs]
  );

  // 🔹 Inicializar y limpiar Realtime
  useEffect(() => {
    if (!clerkId) return;

    let supabaseRealtime = null;
    let channel = null;

    (async () => {
      await fetchJobs();

      const token = await getToken({ template: "supabase" });
      if (!token) {
        console.warn("⚠️ No Clerk token available for realtime.");
        return;
      }

      supabaseRealtime = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
          realtime: { params: { eventsPerSecond: 10 } },
        }
      );

      channel = await subscribeToRealtime(supabaseRealtime);
    })();

    // 🧹 Cleanup seguro
    return () => {
      console.log("🧹 Cleaning up realtime channels...");
      try {
        supabaseRealtime?.removeAllChannels?.();
      } catch (err) {
        console.warn("⚠️ Error cleaning channels:", err.message);
      }
    };
  }, [clerkId, role, getToken, fetchJobs, subscribeToRealtime]);

  // 🔹 Actualizar estado del Job
  const updateStatus = async (id, newStatus) => {
    if (updatingId) return;
    setUpdatingId(id);

    // actualización optimista
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: newStatus } : j))
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
      toast.success(`✅ Job updated to "${newStatus}"`);
    } catch (err) {
      toast.error(err.message);
      await fetchJobs();
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

  return {
    jobs,
    loading,
    fetchJobs,
    updateStatus,
    deleteJob,
  };
}
