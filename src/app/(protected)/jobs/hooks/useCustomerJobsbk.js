"use client";

import { useState, useCallback, useRef } from "react";
import { useSupabaseWithClerk } from "@/utils/supabase/useSupabaseWithClerk";
import { toast } from "sonner";

export function useCustomerJobs({ getToken, clerkId }) {
  const { getClientWithToken } = useSupabaseWithClerk();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const fetchingRef = useRef(false);

  // 🔹 Función universal para queries autenticadas
  const runAuthQuery = useCallback(
    async (queryFn) => {
      try {
        const supabaseAuth = await getClientWithToken();
        if (!supabaseAuth) throw new Error("Supabase client not initialized");

        return await queryFn(supabaseAuth);
      } catch (err) {
        console.error("⚠️ Auth query failed:", err);
        throw err;
      }
    },
    [getClientWithToken]
  );

  // 🔹 Obtener trabajos del cliente
  const fetchCustomerJobs = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const { data, error } = await runAuthQuery((supabaseAuth) =>
        supabaseAuth
          .from("cleaning_jobs")
          .select("*")
          .eq("created_by", clerkId)
          .order("created_at", { ascending: false })
      );

      if (error) throw error;

      setJobs(data || []);
    } catch (err) {
      console.error("❌ Error loading jobs:", err);
      toast.error("Error loading your jobs");
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [runAuthQuery, clerkId]);

  // 🔹 Crear solicitud
  const createJobRequest = useCallback(
    async (newJob) => {
      setLoading(true);
      try {
        const { error } = await runAuthQuery((supabaseAuth) =>
          supabaseAuth.from("cleaning_jobs").insert([
            {
              ...newJob,
              status: "pending",
              created_by: clerkId,
            },
          ])
        );

        if (error) throw error;

        toast.success("🧽 Cleaning request created!");

        await fetchCustomerJobs();
      } catch (err) {
        console.error("❌ Insert error:", err);
        toast.error("Error creating request: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [runAuthQuery, fetchCustomerJobs, clerkId]
  );

  return {
    jobs,
    loading,
    fetchCustomerJobs,
    createJobRequest,
  };
}
