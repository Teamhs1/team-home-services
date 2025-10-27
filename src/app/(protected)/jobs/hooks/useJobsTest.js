"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/utils/supabase/client"; // ✅ cliente único
import { toast } from "sonner";

/**
 * Hook central de Jobs autenticado con Clerk (RLS + Realtime + Broadcast + reconexión)
 * 🔹 Admin escucha todo (realtime + broadcast)
 * 🔹 Staff/Client solo sus trabajos (RLS)
 */
export function useJobs({ clerkId, role, getToken }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const heartbeatRef = useRef(null);
  const reconnectRef = useRef(null);

  // 🧠 Función auxiliar para ejecutar queries autenticadas con Clerk
  const runAuthQuery = useCallback(
    async (queryFn) => {
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Missing Clerk token");

      // Inyecta token en realtime temporalmente
      supabase.realtime.setAuth(token);
      const headers = { Authorization: `Bearer ${token}` };

      return queryFn(headers);
    },
    [getToken]
  );

  // 🔹 Cargar trabajos iniciales
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await runAuthQuery(async () => {
        let query = supabase.from("cleaning_jobs").select("*");
        if (role !== "admin") {
          query = query.or(
            `created_by.eq.${clerkId},assigned_to.eq.${clerkId}`
          );
        }
        return await query.order("created_at", { ascending: false });
      });
      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error("❌ Error loading jobs:", err.message);
      toast.error("Error loading jobs: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [clerkId, role, runAuthQuery]);

  // 🔹 Suscripción Realtime + Broadcast (admin global)
  const subscribeToRealtime = useCallback(async () => {
    try {
      const token = await getToken({ template: "supabase" });
      if (!token) {
        console.warn("⚠️ No Clerk token found for Realtime");
        return null;
      }

      supabase.realtime.setAuth(token);

      // 🧠 Admin escucha TODO
      if (role === "admin") {
        console.log("📡 Admin Realtime: listening for ALL jobs + broadcast...");

        const realtimeChannel = supabase
          .channel("realtime_jobs_admin_global")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "cleaning_jobs" },
            (payload) => {
              console.log(
                "📡 Admin DB event:",
                payload.eventType,
                payload.new || payload.old
              );

              setJobs((prev) => {
                let updated = [...prev];
                if (payload.eventType === "INSERT")
                  updated = [payload.new, ...updated];
                else if (payload.eventType === "UPDATE")
                  updated = updated.map((j) =>
                    j.id === payload.new.id ? payload.new : j
                  );
                else if (payload.eventType === "DELETE")
                  updated = updated.filter((j) => j.id !== payload.old.id);
                return Array.from(
                  new Map(updated.map((j) => [j.id, j])).values()
                );
              });
            }
          )
          .on("broadcast", { event: "job_created" }, async (payload) => {
            console.log("📢 Broadcast received:", payload);
            toast.info("🧾 New job created by client");
            await fetchJobs();
          })
          .subscribe((status) =>
            console.log("📶 Admin Realtime status:", status)
          );

        return realtimeChannel;
      }

      // 🔹 Staff o Client autenticados (filtrados por user)
      const channel = supabase
        .channel(`realtime_jobs_${role}_${clerkId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "cleaning_jobs",
            filter: `created_by=eq.${clerkId},assigned_to=eq.${clerkId}`,
          },
          (payload) => {
            console.log(
              "📡 Event:",
              payload.eventType,
              payload.new || payload.old
            );

            setJobs((prev) => {
              let updated = [...prev];
              if (payload.eventType === "INSERT")
                updated = [payload.new, ...updated];
              else if (payload.eventType === "UPDATE")
                updated = updated.map((j) =>
                  j.id === payload.new.id ? payload.new : j
                );
              else if (payload.eventType === "DELETE")
                updated = updated.filter((j) => j.id !== payload.old.id);
              return Array.from(
                new Map(updated.map((j) => [j.id, j])).values()
              );
            });
          }
        )
        .subscribe((status) => console.log("📶 Realtime status:", status));

      return channel;
    } catch (err) {
      console.error("❌ Error subscribing to realtime:", err.message);
      toast.error("Realtime connection failed");
      return null;
    }
  }, [clerkId, role, getToken, fetchJobs]);

  // 🧩 Reconexión automática
  const reconnectRealtime = useCallback(async () => {
    console.log("🔁 Attempting to reconnect to Realtime...");
    try {
      await supabase.removeAllChannels();
      await subscribeToRealtime();
      toast.success("✅ Realtime reconnected");
    } catch (err) {
      console.error("❌ Reconnect failed:", err.message);
      toast.error("Failed to reconnect Realtime");
    }
  }, [subscribeToRealtime]);

  reconnectRef.current = reconnectRealtime;

  // ❤️ Heartbeat: mantiene viva la conexión para admins
  const startHeartbeat = useCallback(() => {
    if (role !== "admin") return;
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);

    heartbeatRef.current = setInterval(async () => {
      try {
        const { error } = await supabase
          .from("cleaning_jobs")
          .select("id", { count: "exact", head: true });
        if (error) throw error;
        console.log("💓 Heartbeat OK — admin channel still alive");
      } catch (err) {
        console.warn("💔 Heartbeat failed, reconnecting...");
        if (reconnectRef.current) reconnectRef.current();
      }
    }, 60000);
  }, [role]);

  // 🔹 Actualizar estado del Job
  const updateStatus = async (id, newStatus) => {
    if (updatingId) return;
    setUpdatingId(id);

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
      fetchJobs();
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

  // 🔹 Inicializar y limpiar Realtime
  useEffect(() => {
    if (!clerkId) return;
    let realtimeChannel;
    (async () => {
      await fetchJobs();
      realtimeChannel = await subscribeToRealtime();
      startHeartbeat();
    })();

    return () => {
      if (realtimeChannel) {
        console.log("🧹 Unsubscribing from realtime...");
        supabase.removeChannel(realtimeChannel);
      }
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [clerkId, role, fetchJobs, subscribeToRealtime, startHeartbeat]);

  return { jobs, loading, fetchJobs, updateStatus, deleteJob };
}
