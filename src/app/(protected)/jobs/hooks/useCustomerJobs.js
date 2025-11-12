"use client";
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

/**
 * Hook optimizado para manejar los jobs del cliente autenticado con Clerk.
 * Usa el cliente global de Supabase (sin crear nuevas instancias).
 */
export function useCustomerJobs({ getToken, clerkId }) {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const fetchingRef = useRef(false); // ✅ evita race conditions

  // ✅ Función auxiliar para ejecutar queries autenticadas
  const runAuthQuery = useCallback(
    async (queryFn) => {
      try {
        const token = await getToken({ template: "supabase" });
        if (!token)
          throw new Error("Missing Supabase token — user not authenticated.");

        // 👇 Inyectar token temporal para realtime/broadcast
        supabase.realtime.setAuth(token);
        return await queryFn(token);
      } catch (err) {
        console.error("⚠️ Auth query failed:", err);
        throw err;
      }
    },
    [getToken]
  );

  // 🔹 Obtener trabajos del cliente autenticado
  const fetchCustomerJobs = useCallback(async () => {
    if (fetchingRef.current) return; // ⛔ evita llamadas simultáneas
    fetchingRef.current = true;
    setLoading(true);

    try {
      const { data, error } = await runAuthQuery(async () => {
        return await supabase
          .from("cleaning_jobs")
          .select("*")
          .eq("created_by", clerkId)
          .order("created_at", { ascending: false });
      });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error("❌ Error loading customer jobs:", err);
      toast.error("Error loading your requests: " + err.message);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [runAuthQuery, clerkId]);

  // 🔹 Crear nueva solicitud (con broadcast global para admin)
  const createJobRequest = useCallback(
    async (newJob) => {
      setLoading(true);
      try {
        if (!newJob.scheduled_date) {
          toast.error("Please select a scheduled date before submitting.");
          return;
        }

        const { error } = await runAuthQuery(async () => {
          return await supabase.from("cleaning_jobs").insert([
            {
              ...newJob,
              status: "pending",
              created_by: clerkId, // ✅ vínculo con el cliente
            },
          ]);
        });

        if (error) throw error;
        toast.success("✅ Cleaning request created successfully!");

        // 📡 Enviar broadcast global para admin dashboard
        const { error: broadcastError } = await supabase
          .channel("realtime_jobs_admin_global")
          .send({
            type: "broadcast",
            event: "job_created",
            payload: {
              created_by: clerkId,
              title: newJob.title,
              service_type: newJob.service_type,
              scheduled_date: newJob.scheduled_date,
              created_at: new Date().toISOString(),
            },
          });

        if (broadcastError) {
          console.warn("⚠️ Broadcast error:", broadcastError);
        } else {
          console.log(
            "📢 Broadcast enviado al canal realtime_jobs_admin_global"
          );
        }

        // 🔁 Refrescar lista local sin duplicar llamadas
        await fetchCustomerJobs();
      } catch (err) {
        console.error("❌ Supabase insert error:", err);
        toast.error("Error creating request: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [runAuthQuery, fetchCustomerJobs, clerkId]
  );

  // 🔄 Actualizar lista desde eventos Realtime (llamado externamente)
  const handleRealtimeUpdate = useCallback(async (updatedJob) => {
    setJobs((prev) => {
      const exists = prev.find((j) => j.id === updatedJob.id);
      if (exists) {
        return prev.map((j) => (j.id === updatedJob.id ? updatedJob : j));
      }
      return [updatedJob, ...prev];
    });
  }, []);

  return {
    jobs,
    loading,
    fetchCustomerJobs,
    createJobRequest,
    handleRealtimeUpdate,
  };
}
