"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

export function useJobs({ clerkId, role, getToken }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  /* =============================
     FETCH JOBS (JOIN REAL)
  ============================== */
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);

      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Missing Clerk token");

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
        }
      );

      let query = supabase.from("cleaning_jobs").select(`
          *,
          photos:job_photos(image_url),
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
        `);

      // 🔐 FILTROS POR ROL
      if (role === "client") {
        query = query.or(
          `created_by.eq.${clerkId},assigned_client.eq.${clerkId}`
        );
      }

      if (role === "staff") {
        query = query.eq("assigned_to", clerkId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      // ✅ NORMALIZACIÓN LIMPIA (NO TOCAR client)
      const normalizeUrl = (url) => {
        if (!url) return null;
        if (url.startsWith("http")) return url;
        return `${
          process.env.NEXT_PUBLIC_SUPABASE_URL
        }/storage/v1/object/public/job-photos/${url.replace(
          /^\/?job-photos\//,
          ""
        )}`;
      };

      const normalized = (data || []).map((job) => ({
        ...job,
        photos: (job.photos || []).map((p) => ({
          ...p,
          image_url: normalizeUrl(p.image_url),
        })),
      }));

      setJobs(normalized);
    } catch (err) {
      console.error("❌ Error loading jobs:", err.message);
      toast.error("Error loading jobs: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [clerkId, role, getToken]);

  /* =============================
     REALTIME
  ============================== */
  useEffect(() => {
    if (!clerkId) return;

    let supabase;

    (async () => {
      await fetchJobs();

      const token = await getToken({ template: "supabase" });
      if (!token) return;

      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
        }
      );

      const channel = supabase
        .channel("realtime_jobs")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cleaning_jobs" },
          () => fetchJobs()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    })();
  }, [clerkId, fetchJobs, getToken]);

  /* =============================
     ACTIONS
  ============================== */
  const updateStatus = async (id, status) => {
    if (updatingId) return;
    setUpdatingId(id);

    try {
      const token = await getToken({ template: "supabase" });
      const res = await fetch("/api/jobs/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Job updated");
    } catch (err) {
      toast.error(err.message);
      await fetchJobs();
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteJob = async (id) => {
    if (!confirm("Delete job?")) return;
    try {
      const token = await getToken({ template: "supabase" });
      await fetch("/api/jobs/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      toast.success("Job deleted");
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
