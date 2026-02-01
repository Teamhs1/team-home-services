"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

export function useJobs({ clerkId, role, getToken }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  /* =============================
     FETCH JOBS
  ============================== */
  const fetchJobs = useCallback(async () => {
    /* =========================
       🛡️ ADMIN → API
    ========================= */
    if (role === "admin") {
      try {
        setLoading(true);

        const res = await fetch("/api/admin/jobs", {
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load jobs");

        const rawJobs = Array.isArray(json.data) ? json.data : [];

        // 🔒 NORMALIZE ADMIN JOBS (MATCH STAFF/CLIENT SHAPE)
        const normalized = rawJobs.map((job) => ({
          ...job,
          photos: job.photos || [],
          client: job.client || null,
          staff: job.staff || null,
        }));

        setJobs(normalized);
        return normalized;
      } catch (err) {
        console.error("❌ Admin jobs error:", err.message);
        toast.error("Error loading admin jobs");
        setJobs([]);
        return [];
      } finally {
        setLoading(false);
      }
    }

    /* =========================
       👤 STAFF / CLIENT → RLS
    ========================= */
    try {
      setLoading(true);

      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Missing Clerk token");

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
        },
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

      if (role === "staff") {
        query = query.eq("assigned_to", clerkId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      const normalizeUrl = (url) => {
        if (!url) return null;
        if (url.startsWith("http")) return url;
        return `${
          process.env.NEXT_PUBLIC_SUPABASE_URL
        }/storage/v1/object/public/job-photos/${url.replace(
          /^\/?job-photos\//,
          "",
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
      return normalized;
    } catch (err) {
      console.error("❌ Error loading jobs:", err.message);
      toast.error("Error loading jobs: " + err.message);
      setJobs([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [clerkId, role, getToken]);

  /* =============================
     AUTO LOAD
  ============================== */
  useEffect(() => {
    if (!role) return;
    fetchJobs();
  }, [role, fetchJobs]);

  /* =============================
     REALTIME (solo staff/client)
  ============================== */
  useEffect(() => {
    if (!clerkId || role === "admin") return;

    let supabase;

    (async () => {
      const token = await getToken({ template: "supabase" });
      if (!token) return;

      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
        },
      );

      const channel = supabase
        .channel("realtime_jobs")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cleaning_jobs" },
          () => fetchJobs(),
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    })();
  }, [clerkId, role, fetchJobs, getToken]);

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
      await fetchJobs();
    } catch (err) {
      toast.error(err.message);
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
      await fetchJobs();
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
