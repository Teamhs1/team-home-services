"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

/**
 * Hook central de Jobs autenticado con Clerk
 * - Compatible con políticas RLS
 * - Incluye Realtime y Broadcast
 * - Ahora trae fotos relacionadas desde job_photos
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

      // ✅ Incluye fotos relacionadas
      let query = supabaseAuth
        .from("cleaning_jobs")
        .select(`*, photos:job_photos(image_url)`);

      if (role !== "admin") {
        query = query.or(`created_by.eq.${clerkId},assigned_to.eq.${clerkId}`);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      // ✅ Normalizar URLs relativas a públicas
      const normalizeUrl = (url) => {
        if (!url) return null;
        if (url.startsWith("http")) return url;
        const clean = url.replace(/^\/?job-photos\//, "").trim();
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/job-photos/${clean}`;
      };

      const normalizedData = (data || []).map((job) => ({
        ...job,
        photos: (job.photos || []).map((p) => ({
          ...p,
          image_url: normalizeUrl(p.image_url),
        })),
      }));

      setJobs(normalizedData);

      setJobs(normalizedData);
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
              return Array.from(
                new Map(updated.map((j) => [j.id, j])).values()
              );
            });
          }
        );

        if (role === "admin") {
          channel.on(
            "broadcast",
            { event: "job_created" },
            async ({ payload }) => {
              console.log("📢 Broadcast recibido:", payload);

              // ✅ Detectar rol y título dinámicamente
              const jobRole = role || "admin";

              const jobTitle = payload?.title || "Untitled Job";

              // 🎨 Mapas de color y emojis
              const colorMap = {
                admin: "text-blue-600 bg-blue-50 border-blue-200",
                staff: "text-green-600 bg-green-50 border-green-200",
                client: "text-gray-600 bg-gray-50 border-gray-200",
                unknown: "text-gray-400 bg-gray-100 border-gray-100",
              };

              const iconMap = {
                admin: "🔵",
                staff: "🟢",
                client: "⚫",
                unknown: "❔",
              };

              const message = `${iconMap[jobRole]} New job created by ${jobRole}`;

              // ✅ Toast visual dinámico
              toast.custom(
                (t) => (
                  <div
                    className={`flex items-center gap-2 px-4 py-3 rounded-md border ${colorMap[jobRole]} shadow-sm text-sm font-medium`}
                  >
                    <span className="text-lg">{iconMap[jobRole]}</span>
                    <span>{message}</span>
                    <span className="ml-auto italic text-gray-500">
                      ({jobTitle})
                    </span>
                  </div>
                ),
                { duration: 4000 }
              );

              // 🔁 Refrescar lista
              await fetchJobs();
            }
          );
        }

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
