"use client";

import { useState, useCallback, useRef } from "react";
import { useSupabaseWithClerk } from "@/utils/supabase/useSupabaseWithClerk";
import { toast } from "sonner";

export function useCustomerJobs() {
  const { getClientWithToken } = useSupabaseWithClerk();

  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);

  const fetchingRef = useRef(false);

  /* =========================
     AUTH QUERY HELPER
  ========================= */
  const runAuthQuery = useCallback(
    async (queryFn) => {
      const supabase = await getClientWithToken();
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }
      return queryFn(supabase);
    },
    [getClientWithToken],
  );

  /* =========================
     GET AUTH SUB (JWT REAL)
  ========================= */
  const getAuthSub = useCallback(async () => {
    const supabase = await getClientWithToken();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id) {
      console.error("❌ Could not get auth sub:", error);
      return null;
    }

    return user.id; // 👈 sub real usado por RLS
  }, [getClientWithToken]);

  /* =========================
     FETCH CUSTOMER JOBS
     - creados por el client
     - creados por admin y asignados al client
     - NORMALIZA property_address
  ========================= */
  const fetchCustomerJobs = useCallback(async () => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setLoading(true);

    try {
      const sub = await getAuthSub();
      if (!sub) return;

      const { data, error } = await runAuthQuery((supabase) =>
        supabase
          .from("cleaning_jobs")
          .select(
            `
            *,
            client:profiles!cleaning_jobs_assigned_client_fkey (
              clerk_id,
              full_name,
              email
            ),
            staff:profiles!cleaning_jobs_assigned_to_fkey (
              clerk_id,
              full_name,
              email
            )
          `,
          )
          .or(`created_by.eq.${sub},assigned_client.eq.${sub}`)
          .order("created_at", { ascending: false }),
      );

      if (error) throw error;

      // ✅ NORMALIZACIÓN CLAVE (NO ROMPE NADA)
      const normalized = (data || []).map((job) => ({
        ...job,
        property_address:
          job.property_address?.trim() ||
          job.title?.trim() ||
          "Address not specified",
      }));

      setJobs(normalized);
    } catch (err) {
      console.error("❌ Error loading jobs:", err);
      toast.error("Error loading your jobs");
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [runAuthQuery, getAuthSub]);

  /* =========================
     CREATE JOB REQUEST (CLIENT)
  ========================= */
  const createJobRequest = useCallback(
    async (newJob) => {
      setLoading(true);

      try {
        const sub = await getAuthSub();
        if (!sub) throw new Error("User not authenticated");

        const payload = {
          title: newJob.title?.trim() || "Cleaning Request",
          service_type: newJob.service_type,
          scheduled_date: newJob.scheduled_date,
          notes: newJob.notes || null,

          created_by: sub,
          assigned_client: sub,

          property_address:
            newJob.property_address?.trim() ||
            newJob.title?.trim() ||
            "Address not provided",

          status: "pending",
        };

        const { data, error } = await runAuthQuery((supabase) =>
          supabase.from("cleaning_jobs").insert([payload]).select().single(),
        );

        if (error) throw error;

        toast.success("🧽 Cleaning request created!");
        return data; // 🔥 CLAVE
      } catch (err) {
        console.error("❌ Insert error:", err);
        toast.error(err.message || "Error creating request");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [runAuthQuery, getAuthSub],
  );

  return {
    jobs,
    loading,
    fetchCustomerJobs,
    createJobRequest,
  };
}
