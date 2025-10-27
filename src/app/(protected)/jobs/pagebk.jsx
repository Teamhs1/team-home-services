"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

import { useJobs } from "./hooks/useJobs";
import { useStaff } from "./hooks/useStaff";

import AdminJobsView from "./components/AdminJobsView";
import StaffJobsView from "./components/StaffJobsView";
import ClientJobsView from "./components/ClientJobsView";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function JobsPage() {
  const { isLoaded: userLoaded, user } = useUser();
  const { isLoaded: authLoaded, getToken } = useAuth();
  const ready = userLoaded && authLoaded;

  const clerkId = user?.id;
  const role = user?.publicMetadata?.role || "client";

  const {
    jobs,
    loading,
    fetchJobs,
    subscribeToRealtime,
    updateStatus,
    deleteJob,
  } = useJobs({ clerkId, role, getToken });
  const { staffList, fetchStaff } = useStaff();

  // Estado de cliente
  const [customerJobs, setCustomerJobs] = useState([]);
  const [form, setForm] = useState({
    title: "",
    service_type: "",
    property_address: "",
    scheduled_date: "",
  });
  const [customerLoading, setCustomerLoading] = useState(false);

  // Modo de vista (para admin/staff)
  const [viewMode, setViewMode] = useState("list");

  // Cargar preferencia de vista
  useEffect(() => {
    const saved = localStorage.getItem("viewMode");
    if (saved) setViewMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  // Cargar datos iniciales
  useEffect(() => {
    if (!ready || !clerkId) return;
    (async () => {
      await fetchJobs();
      if (role === "admin") await fetchStaff();
      if (role === "client") await fetchCustomerJobs();
    })();

    const channel = subscribeToRealtime();
    return () => channel.unsubscribe?.();
  }, [ready, clerkId, role]);

  const filteredJobs = useMemo(() => jobs || [], [jobs]);
  const isClient = role === "client";

  // 🔹 Obtener trabajos del cliente
  async function fetchCustomerJobs() {
    if (role !== "client") return;
    setCustomerLoading(true);
    try {
      const token = await getToken({ template: "supabase" });
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data, error } = await supabaseAuth
        .from("cleaning_jobs")
        .select("*")
        .eq("created_by", clerkId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCustomerJobs(data || []);
    } catch (err) {
      toast.error("Error loading your requests: " + err.message);
    } finally {
      setCustomerLoading(false);
    }
  }

  // 🔹 Crear solicitud del cliente
  async function createCustomerJob() {
    if (!form.title || !form.service_type || !form.scheduled_date) {
      toast.error("Please fill all required fields.");
      return;
    }
    try {
      setCustomerLoading(true);
      const token = await getToken({ template: "supabase" });
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { error } = await supabaseAuth.from("cleaning_jobs").insert([
        {
          title: form.title,
          service_type: form.service_type,
          property_address: form.property_address,
          scheduled_date: form.scheduled_date,
          created_by: clerkId,
          status: "pending",
        },
      ]);
      if (error) throw error;
      toast.success("✅ Request sent successfully!");
      setForm({
        title: "",
        service_type: "",
        property_address: "",
        scheduled_date: "",
      });
      fetchCustomerJobs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCustomerLoading(false);
    }
  }

  if (!ready || loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );

  // 🔹 Render por rol
  if (role === "admin")
    return (
      <AdminJobsView
        jobs={filteredJobs}
        staffList={staffList}
        viewMode={viewMode}
        setViewMode={setViewMode}
        fetchJobs={fetchJobs}
        getToken={getToken}
        updateStatus={updateStatus}
        deleteJob={deleteJob}
      />
    );

  if (role === "staff")
    return (
      <StaffJobsView
        jobs={filteredJobs}
        viewMode={viewMode}
        setViewMode={setViewMode}
        updateStatus={updateStatus}
      />
    );

  return (
    <ClientJobsView
      customerJobs={customerJobs}
      customerLoading={customerLoading}
      form={form}
      setForm={setForm}
      createCustomerJob={createCustomerJob}
      updateStatus={updateStatus}
    />
  );
}
