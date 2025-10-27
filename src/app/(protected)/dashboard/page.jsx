"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import AdminDashboard from "./AdminView";
import StaffView from "./StaffView";
import CustomerView from "./CustomerView";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

export default function DashboardPage() {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = user?.publicMetadata?.role || "client";
  const clerkId = user?.id;

  // ✅ Crear cliente autenticado de Supabase
  const createSupabaseClient = useCallback(async () => {
    const token = await getToken({ template: "supabase" });
    if (!token) {
      console.warn("⚠️ No se encontró token Clerk. Usando cliente anónimo.");
    }
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      token
        ? { global: { headers: { Authorization: `Bearer ${token}` } } }
        : undefined
    );
  }, [getToken]);

  // ✅ Cargar trabajos del usuario (staff o cliente)
  const fetchCustomerJobs = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = await createSupabaseClient();
      if (!supabase) return;

      let query = supabase.from("cleaning_jobs").select("*");

      if (role === "client" || role === "customer") {
        query = query.eq("created_by", clerkId);
      } else if (role === "staff") {
        query = query.eq("assigned_to", clerkId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error("❌ Error fetching jobs:", err.message);
      toast.error("Error loading jobs: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [createSupabaseClient, role, clerkId]);

  // ✅ Crear solicitud (solo clientes)
  const createJobRequest = useCallback(
    async (job) => {
      try {
        setLoading(true);
        const supabase = await createSupabaseClient();
        if (!supabase) return;

        const { error } = await supabase.from("cleaning_jobs").insert([
          {
            title: job.title,
            service_type: job.service_type,
            property_address: job.property_address,
            status: "pending",
            created_by: clerkId,
          },
        ]);

        if (error) throw error;
        toast.success("✅ Request submitted successfully!");
        await fetchCustomerJobs();
      } catch (err) {
        console.error("❌ Error creating job request:", err.message);
        toast.error("Failed to submit request");
      } finally {
        setLoading(false);
      }
    },
    [createSupabaseClient, clerkId, fetchCustomerJobs]
  );

  // 🧩 Esperar a que Clerk esté cargado
  useEffect(() => {
    if (isLoaded && user) {
      fetchCustomerJobs();
    }
  }, [isLoaded, user, fetchCustomerJobs]);

  // 🚀 Mostrar según rol
  if (!isLoaded)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );

  if (role === "admin") {
    return (
      <main className="px-6 md:px-12 lg:px-16 xl:px-20 py-10 max-w-[1600px] mx-auto space-y-10">
        <AdminDashboard />
      </main>
    );
  }

  if (role === "staff") {
    return <StaffView />;
  }

  // 👇 Vista para clientes
  return (
    <CustomerView
      jobs={jobs}
      loading={loading}
      createJobRequest={createJobRequest}
      fetchCustomerJobs={fetchCustomerJobs}
    />
  );
}
