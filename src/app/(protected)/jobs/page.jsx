"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { useStaff } from "./hooks/useStaff";
import { useClients } from "./hooks/useClients";

import AdminJobsView from "./components/AdminJobsView";
import StaffJobsView from "./components/StaffJobsView";
import ClientJobsView from "./components/ClientJobsView";

export default function JobsPage() {
  const { isLoaded: userLoaded, user } = useUser();
  const { isLoaded: authLoaded } = useAuth();
  const ready = userLoaded && authLoaded;

  const clerkId = user?.id;
  const role = user?.publicMetadata?.role || "client";

  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status") || "all";

  /* ======================
     ADMIN / STAFF STATE
  ====================== */
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const { staffList, fetchStaff } = useStaff();
  const { clientList, fetchClients } = useClients();

  /* ======================
        CLIENT STATE
  ====================== */
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
      const res = await fetch("/api/staff/jobs", { cache: "no-store" });
      const json = await res.json();
      setJobs(Array.isArray(json) ? json : []);
    } catch {
      toast.error("Error loading staff jobs");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
        CLIENT JOBS
  ====================== */
  const fetchCustomerJobs = async () => {
    setCustomerLoading(true);
    try {
      const res = await fetch("/api/jobs/client", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCustomerJobs(json.jobs || []);
    } catch (err) {
      toast.error(err.message || "Error loading jobs");
    } finally {
      setCustomerLoading(false);
    }
  };

  /* ======================
        DELETE JOB
  ====================== */
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
      await fetchAdminJobs();
    } catch (err) {
      toast.error(err.message || "Error deleting job");
    }
  };

  /* ======================
     CREATE CLIENT JOB
  ====================== */
  const createCustomerJob = async () => {
    if (!form.service_type || !form.scheduled_date) {
      toast.error("Missing required fields");
      return;
    }

    try {
      const res = await fetch("/api/jobs/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create job");

      toast.success("🧽 Cleaning request created");

      setForm({
        title: "",
        service_type: "",
        property_address: "",
        scheduled_date: "",
        notes: "",
      });

      await fetchCustomerJobs();
    } catch (err) {
      toast.error(err.message || "Failed to create request");
    }
  };

  /* ======================
        ADMIN JOBS
  ====================== */
  const fetchAdminJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        console.warn("⏳ Clerk not ready yet (admin jobs)");
        return;
      }

      const json = await res.json();
      setJobs(Array.isArray(json) ? json : []);
    } catch {
      toast.error("Error loading admin jobs");
    } finally {
      setLoading(false);
    }
  };

  const [viewMode, setViewMode] = useState("list");

  /* ======================
        INIT LOAD
  ====================== */
  useEffect(() => {
    if (!ready || !clerkId) return;

    (async () => {
      if (role === "admin") {
        await fetchAdminJobs();
        await fetchStaff();
        await fetchClients();
      }

      if (role === "staff") {
        await fetchStaffJobs();
      }

      if (role === "client") {
        await fetchCustomerJobs();
      }
    })();
  }, [ready, clerkId, role]);

  const filteredJobs = useMemo(() => {
    if (activeStatus === "all") return jobs;
    return jobs.filter((j) => j.status === activeStatus);
  }, [jobs, activeStatus]);

  if (!ready || (loading && role !== "client")) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

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
          fetchJobs={fetchStaffJobs}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      ) : (
        <ClientJobsView
          customerJobs={customerJobs}
          customerLoading={customerLoading}
          form={form}
          setForm={setForm}
          createCustomerJob={createCustomerJob}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      )}
    </div>
  );
}
