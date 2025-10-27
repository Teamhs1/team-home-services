"use client";
import { useState, useCallback } from "react";
import { supabase } from "@/utils/supabase/client"; // ✅ cliente global
import { toast } from "sonner";

/**
 * Hook para manejar los jobs del cliente autenticado con Clerk.
 * Usa el cliente global de Supabase (sin crear nuevas instancias).
 */
export function useCustomerJobs({ getToken, clerkId }) {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);

  // ✅ Función auxiliar para ejecutar queries autenticadas
  const runAuthQuery = useCallback(
    async (queryFn) => {
      try {
        const token = await getToken({ template: "supabase" });
        if (!token)
          throw new Error("Missing Supabase token — user not authenticated.");

        // 👇 Inyecta token temporalmente para broadcast/realtime
        supabase.realtime.setAuth(token);
        const headers = { Authorization: `Bearer ${token}` };

        return await queryFn(headers);
      } catch (err) {
        throw err;
      }
    },
    [getToken]
  );

  // 🔹 Obtener solicitudes del cliente
  const fetchCustomerJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await runAuthQuery(async () => {
        return await supabase
          .from("cleaning_jobs")
          .select("*")
          .order("created_at", { ascending: false });
      });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      toast.error("Error loading your requests: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [runAuthQuery]);

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
            },
          ]);
        });

        if (error) throw error;

        toast.success("✅ Request sent successfully!");

        // 📡 Enviar broadcast global para el admin
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
          console.error("❌ Broadcast error:", broadcastError);
        } else {
          console.log(
            "📢 Broadcast enviado al canal realtime_jobs_admin_global"
          );
        }

        // 🔁 Refrescar lista del cliente
        fetchCustomerJobs();
      } catch (err) {
        console.error("❌ Supabase insert error:", err);
        toast.error("Error creating request: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [runAuthQuery, fetchCustomerJobs, clerkId]
  );

  return { jobs, loading, fetchCustomerJobs, createJobRequest };
}
