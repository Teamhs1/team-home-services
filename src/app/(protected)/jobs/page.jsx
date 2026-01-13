"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

import { useStaff } from "./hooks/useStaff";
import { useClients } from "./hooks/useClients";

import AdminJobsView from "./components/AdminJobsView";
import StaffJobsView from "./components/StaffJobsView";
import ClientJobsView from "./components/ClientJobsView";

export default function JobsPage() {
  const { isLoaded: userLoaded, user } = useUser();
  const { isLoaded: authLoaded, getToken } = useAuth();
  const ready = userLoaded && authLoaded;

  const clerkId = user?.id;
  const role = user?.publicMetadata?.role || "client";

  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status") || "all";

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [profileId, setProfileId] = useState(null);

  const { staffList, fetchStaff } = useStaff();
  const { clientList, fetchClients } = useClients();

  const [customerJobs, setCustomerJobs] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    service_type: "",
    property_address: "",
    scheduled_date: "",
    notes: "",
  });
  /* ======================
   STAFF JOBS
====================== */
  const fetchStaffJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/jobs", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();
      setJobs(Array.isArray(json) ? json : []);
    } catch {
      toast.error("Error loading staff jobs");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     LOAD PROFILE ID
  ====================== */
  const loadProfileId = async () => {
    try {
      const token = await getToken({ template: "supabase" });

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        }
      );

      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", clerkId)
        .single();

      if (error) throw error;

      setProfileId(data.id);
    } catch {
      toast.error("Failed to load profile");
    }
  };

  /* ======================
     FETCH CLIENT JOBS
  ====================== */
  const fetchCustomerJobs = async () => {
    if (!profileId) return;

    setCustomerLoading(true);
    try {
      const token = await getToken({ template: "supabase" });

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        }
      );

      const { data, error } = await supabase
        .from("cleaning_jobs")
        .select("*")
        .eq("assigned_client", profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCustomerJobs(data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCustomerLoading(false);
      setLoading(false);
    }
  };
  /**===========================
   * Delete ======================*/
  const deleteJob = async (jobId) => {
    try {
      const res = await fetch("/api/jobs/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("🗑️ Job deleted");
      await fetchAdminJobs(); // 🔥 refresca jobs
    } catch (err) {
      toast.error(err.message || "Error deleting job");
    }
  };

  /* ======================
     CREATE CLIENT JOB ✅ FIX
  ====================== */
  const createCustomerJob = async () => {
    if (!profileId) {
      toast.error("Profile not loaded");
      return;
    }

    if (!form.service_type || !form.scheduled_date) {
      toast.error("Missing required fields");
      return;
    }

    try {
      const token = await getToken({ template: "supabase" });

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        }
      );

      const { error } = await supabase.from("cleaning_jobs").insert({
        title: form.title || "Cleaning Request",
        service_type: form.service_type,
        property_address: form.property_address || null,
        scheduled_date: form.scheduled_date,
        notes: form.notes || null,

        assigned_client: profileId, // 👈 UUID correcto
        created_by: profileId, // ✅ CLAVE DEL ERROR
        status: "pending",
      });

      if (error) throw error;

      toast.success("Cleaning request created");

      setForm({
        title: "",
        service_type: "",
        property_address: "",
        scheduled_date: "",
        notes: "",
      });

      fetchCustomerJobs();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create request");
    }
  };

  /* ======================
     ADMIN JOBS
  ====================== */
  const fetchAdminJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/jobs", { cache: "no-store" });
      const json = await res.json();
      setJobs(Array.isArray(json) ? json : []);
    } catch {
      toast.error("Error loading admin jobs");
    } finally {
      setLoading(false);
    }
  };

  const [viewMode, setViewMode] = useState("list");

  useEffect(() => {
    if (!ready || !clerkId) return;

    (async () => {
      if (role === "admin") {
        await fetchAdminJobs();
        await fetchStaff();
        await fetchClients();
      }

      if (role === "staff") {
        await fetchStaffJobs(); // 🔥 CLAVE
      }

      if (role === "client") {
        await loadProfileId();
      }
    })();
  }, [ready, clerkId, role]);

  useEffect(() => {
    if (role === "client" && profileId) {
      fetchCustomerJobs();
    }
  }, [profileId, role]);

  const filteredJobs = useMemo(() => {
    if (activeStatus === "all") return jobs;
    return jobs.filter((j) => j.status === activeStatus);
  }, [jobs, activeStatus]);

  if (!ready || loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );

  return (
    <div className="pt-4 sm:pt-24 px-2 sm:px-4 md:px-6 lg:px-8">
      {role === "admin" ? (
        <AdminJobsView
          jobs={filteredJobs}
          staffList={staffList}
          clientList={clientList}
          viewMode={viewMode}
          setViewMode={setViewMode}
          fetchJobs={fetchAdminJobs}
          deleteJob={deleteJob}
          activeStatus={activeStatus}
        />
      ) : role === "staff" ? (
        <StaffJobsView
          jobs={filteredJobs}
          fetchJobs={fetchStaffJobs} // 🔥 IMPORTANTE
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      ) : (
        <ClientJobsView
          customerJobs={customerJobs}
          customerLoading={customerLoading}
          form={form}
          setForm={setForm}
          createCustomerJob={createCustomerJob} // ✅ YA FUNCIONA
          profileId={profileId}
          viewMode={viewMode}
          setViewMode={setViewMode}
          getToken={getToken}
        />
      )}
    </div>
  );
}
