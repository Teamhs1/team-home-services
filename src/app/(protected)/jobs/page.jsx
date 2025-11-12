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
  const [viewMode, setViewMode] = useState(() => "list");

  // ✅ Forzar vista "list" si el usuario es admin o staff
  useEffect(() => {
    if (role === "admin" || role === "staff") {
      setViewMode("list");
    }
  }, [role]);

  // ✅ Cargar datos iniciales
  useEffect(() => {
    if (!ready || !clerkId) return;

    (async () => {
      try {
        const token = await getToken({ template: "supabase" });
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          console.log("🪶 Clerk JWT payload:", payload);
        }
      } catch (err) {
        console.error("Error mostrando token:", err);
      }

      await fetchJobs();
      if (role === "admin") await fetchStaff();
      if (role === "client") await fetchCustomerJobs();
    })();
  }, [ready, clerkId, role]);

  const filteredJobs = useMemo(() => jobs || [], [jobs]);

  // 🧩 Cargar trabajos del cliente
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
        .eq("created_by", clerkId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomerJobs(data || []);
    } catch (err) {
      toast.error("Error loading jobs: " + err.message);
    } finally {
      setCustomerLoading(false);
    }
  }

  // 🧾 Crear trabajo del cliente
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

  // ✅ Realtime para CLIENT
  useEffect(() => {
    if (role !== "client" || !clerkId) return;

    const initRealtime = async () => {
      try {
        const token = await getToken({ template: "supabase" });
        if (!token) return console.warn("⚠️ No token for realtime (client)");

        const supabaseRealtime = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        await supabaseRealtime.auth.setSession({ access_token: token });

        const channel = supabaseRealtime
          .channel(`client_jobs_${clerkId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "cleaning_jobs",
              filter: `created_by=eq.${clerkId}`,
            },
            (payload) => {
              const { eventType, new: newJob, old: oldJob } = payload;
              console.log("📡 Client Realtime Event:", eventType, newJob);

              setCustomerJobs((prev) => {
                if (eventType === "INSERT") return [newJob, ...prev];
                if (eventType === "UPDATE")
                  return prev.map((j) => (j.id === newJob.id ? newJob : j));
                if (eventType === "DELETE")
                  return prev.filter((j) => j.id !== oldJob.id);
                return prev;
              });

              // 💬 Feedback visual
              if (eventType === "UPDATE") {
                if (newJob.status === "in_progress")
                  toast.info("🧽 Your cleaning has started!");
                else if (newJob.status === "completed")
                  toast.success("✨ Cleaning completed!");
              }
            }
          )
          .subscribe((status) =>
            console.log("📶 Client realtime channel status:", status)
          );

        return () => {
          supabaseRealtime.removeChannel(channel);
          console.log("❌ Unsubscribed from client realtime");
        };
      } catch (err) {
        console.error("❌ Error in client realtime:", err);
      }
    };

    initRealtime();
  }, [role, clerkId, getToken]);

  // ✅ Realtime para STAFF
  useEffect(() => {
    if (role !== "staff" || !clerkId) return;

    const initRealtimeStaff = async () => {
      try {
        const token = await getToken({ template: "supabase" });
        if (!token) return console.warn("⚠️ No token for realtime (staff)");

        const supabaseRealtime = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        await supabaseRealtime.auth.setSession({ access_token: token });

        const channel = supabaseRealtime
          .channel(`staff_jobs_${clerkId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "cleaning_jobs",
              filter: `assigned_to=eq.${clerkId}`,
            },
            (payload) => {
              const { eventType, new: newJob, old: oldJob } = payload;
              console.log("📡 Staff Realtime Event:", eventType, newJob);

              // 🔄 Actualizar lista local
              if (eventType === "INSERT") fetchJobs();
              if (eventType === "UPDATE" || eventType === "DELETE") fetchJobs();

              // 💬 Toasts informativos
              if (eventType === "UPDATE") {
                if (newJob.status === "in_progress") {
                  toast.info("🚀 Job started!", {
                    description: newJob.title,
                  });
                } else if (newJob.status === "completed") {
                  toast.success("✅ Job completed!", {
                    description: newJob.title,
                  });
                } else {
                  toast.message("🔁 Job updated", {
                    description: newJob.title,
                  });
                }
              }
            }
          )
          .subscribe((status) =>
            console.log("📶 Staff realtime channel status:", status)
          );

        return () => {
          supabaseRealtime.removeChannel(channel);
          console.log("❌ Unsubscribed from staff realtime");
        };
      } catch (err) {
        console.error("❌ Error in staff realtime:", err);
      }
    };

    initRealtimeStaff();
  }, [role, clerkId, getToken, fetchJobs]);

  // 🕐 Spinner de carga inicial
  if (!ready || loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );

  // ✅ Render principal
  return (
    <div className="pt-24 px-4 md:px-6 lg:px-8">
      {filteredJobs.length === 0 && role !== "client" && (
        <p className="text-center text-gray-500 italic mb-6">
          No jobs available yet.
        </p>
      )}

      {role === "admin" ? (
        <AdminJobsView
          jobs={filteredJobs}
          staffList={staffList}
          viewMode={viewMode}
          setViewMode={setViewMode}
          fetchJobs={fetchJobs}
          updateStatus={updateStatus}
          deleteJob={deleteJob}
        />
      ) : role === "staff" ? (
        <StaffJobsView
          jobs={filteredJobs}
          viewMode={viewMode}
          setViewMode={setViewMode}
          updateStatus={updateStatus}
          fetchJobs={fetchJobs}
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
          viewMode={viewMode}
          setViewMode={setViewMode}
          getToken={getToken}
        />
      )}
    </div>
  );
}
