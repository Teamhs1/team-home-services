"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { Loader2, LayoutGrid, List } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

import { useJobs } from "./hooks/useJobs";
import { useStaff } from "./hooks/useStaff";

import AdminJobsView from "./components/AdminJobsView";
import StaffJobsView from "./components/StaffJobsView";
import ClientJobsView from "./components/ClientJobsView";
import { Button } from "@/components/ui/button";

export default function JobsPage() {
  const { isLoaded: userLoaded, user } = useUser();
  const { isLoaded: authLoaded, getToken } = useAuth();
  const ready = userLoaded && authLoaded;

  const clerkId = user?.id;
  const role = user?.publicMetadata?.role || "client";

  const { jobs, loading, fetchJobs, updateStatus, deleteJob } = useJobs({
    clerkId,
    role,
    getToken,
  });

  const { staffList, fetchStaff } = useStaff();

  const [customerJobs, setCustomerJobs] = useState([]);
  const [form, setForm] = useState({
    title: "",
    service_type: "",
    property_address: "",
    scheduled_date: "",
  });
  const [customerLoading, setCustomerLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  useEffect(() => {
    if (!ready || !clerkId) return;
    (async () => {
      await fetchJobs();
      if (role === "admin") await fetchStaff();
      if (role === "client") await fetchCustomerJobs();
    })();
  }, [ready, clerkId, role]);

  const filteredJobs = useMemo(() => jobs || [], [jobs]);

  async function fetchCustomerJobs() {
    if (role !== "client") return;
    setCustomerLoading(true);
    try {
      const token = await getToken({ template: "supabase" });
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
        }
      );
      const { data, error } = await supabaseAuth
        .from("cleaning_jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomerJobs(data || []);
    } catch (err) {
      toast.error("Error loading jobs: " + err.message);
    } finally {
      setCustomerLoading(false);
    }
  }

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
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
        }
      );

      const { data, error } = await supabaseAuth
        .from("cleaning_jobs")
        .insert([
          {
            title: form.title,
            service_type: form.service_type,
            property_address: form.property_address,
            scheduled_date: form.scheduled_date,
            created_by: clerkId,
            status: "pending",
          },
        ])
        .select("*");

      if (error) throw error;
      if (data?.length) setCustomerJobs((prev) => [data[0], ...prev]);

      toast.success("✅ Request sent successfully!");
      setForm({
        title: "",
        service_type: "",
        property_address: "",
        scheduled_date: "",
      });
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

  // 🔳 Botón global de cambio de vista
  const ViewToggleButton = () => (
    <div className="flex justify-end mb-4 px-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
        className="flex items-center gap-2"
        title={`Switch to ${viewMode === "grid" ? "List" : "Grid"} View`}
      >
        {viewMode === "grid" ? (
          <List className="w-4 h-4" />
        ) : (
          <LayoutGrid className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="pt-24 px-4 md:px-6 lg:px-8">
      {/* 🔹 Mostrar el botón arriba solo si NO es client */}
      {role !== "client" && <ViewToggleButton />}

      {role === "admin" ? (
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
      ) : role === "staff" ? (
        <StaffJobsView
          jobs={filteredJobs}
          viewMode={viewMode}
          setViewMode={setViewMode}
          updateStatus={updateStatus}
          getToken={getToken} // ✅ importante
        />
      ) : (
        <ClientJobsView
          customerJobs={customerJobs}
          customerLoading={customerLoading}
          form={form}
          setForm={setForm}
          createCustomerJob={createCustomerJob}
          updateStatus={updateStatus}
          clerkId={clerkId}
          getToken={getToken}
          viewMode={viewMode}
          setViewMode={setViewMode} // ✅ <-- agrega esta línea
        />
      )}
    </div>
  );
}
