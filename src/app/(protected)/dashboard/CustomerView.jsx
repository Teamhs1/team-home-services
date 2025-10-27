"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, ClipboardList, CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";

export default function CustomerDashboard() {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newJob, setNewJob] = useState({
    title: "",
    service_type: "",
    property_address: "",
  });

  const clerkId = user?.id;
  const role = user?.publicMetadata?.role || "client";

  // ✅ Cliente autenticado de Supabase
  const createSupabaseClient = useCallback(async () => {
    if (!isLoaded) return null;
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("No token from Clerk");
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
  }, [getToken, isLoaded]);

  // 📦 Cargar trabajos creados por el cliente
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const supabaseAuth = await createSupabaseClient();
      if (!supabaseAuth) return;

      const { data, error } = await supabaseAuth
        .from("cleaning_jobs")
        .select("*")
        .eq("created_by", clerkId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error("❌ Error fetching jobs:", err.message);
      toast.error("Error loading jobs: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [createSupabaseClient, clerkId]);

  // 🧩 Crear nueva solicitud
  const createJobRequest = useCallback(
    async (newJob) => {
      try {
        setLoading(true);
        const supabaseAuth = await createSupabaseClient();
        if (!supabaseAuth) return;

        const { error } = await supabaseAuth.from("cleaning_jobs").insert([
          {
            title: newJob.title,
            service_type: newJob.service_type,
            property_address: newJob.property_address,
            created_by: clerkId,
            status: "pending",
          },
        ]);

        if (error) throw error;
        toast.success("✅ Request submitted successfully!");
        await fetchJobs();
        setNewJob({ title: "", service_type: "", property_address: "" });
      } catch (err) {
        console.error("❌ Error creating job request:", err.message);
        toast.error("Failed to submit request");
      } finally {
        setLoading(false);
      }
    },
    [createSupabaseClient, clerkId, fetchJobs]
  );

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (role !== "client" && role !== "customer") return;
    fetchJobs();
  }, [isLoaded, user, role, fetchJobs]);

  // 📊 Métricas
  const stats = useMemo(() => {
    const total = jobs.length;
    const pending = jobs.filter((j) => j.status === "pending").length;
    const inProgress = jobs.filter((j) => j.status === "in_progress").length;
    const completed = jobs.filter((j) => j.status === "completed").length;
    return { total, pending, inProgress, completed };
  }, [jobs]);

  // 📅 Gráfico semanal
  const weeklyData = useMemo(() => {
    const map = {};
    jobs.forEach((job) => {
      if (!job.created_at) return;
      const date = new Date(job.created_at);
      const week = date.toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
      });
      map[week] = map[week] || { date: week, completed: 0, pending: 0 };
      if (job.status === "completed") map[week].completed++;
      if (job.status === "pending") map[week].pending++;
    });
    return Object.values(map).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [jobs]);

  if (!isLoaded || loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );

  return (
    <main className="pt-6 md:pt-10 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          My Cleaning Dashboard
        </h2>
      </div>

      {/* 📊 Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Requests"
          value={stats.total}
          desc="All my jobs"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          desc="Awaiting start"
          color="text-yellow-600"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          desc="Currently active"
          color="text-blue-600"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          desc="Finished successfully"
          color="text-green-600"
        />
      </div>

      {/* 📈 Gráfico semanal */}
      <Card className="border border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
          <CardDescription>Completed vs Pending Jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyData.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              No job data available yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="#22c55e" name="Completed" />
                <Bar dataKey="pending" fill="#eab308" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 🧾 Trabajos recientes */}
      <Card className="border border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="w-5 h-5 text-primary" />
            Recent Requests
          </CardTitle>
          <CardDescription>Last 10 created jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              You haven’t created any service requests yet.
            </p>
          ) : (
            <ul className="divide-y">
              {jobs.slice(0, 10).map((job) => (
                <li
                  key={job.id}
                  className="py-3 flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">
                        {job.title || "Untitled Job"}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {job.created_at
                          ? new Date(job.created_at).toLocaleDateString()
                          : "No date set"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      job.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : job.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {job.status?.replace("_", " ") || "pending"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

/* ✅ Componente para tarjetas de métricas */
function StatCard({ title, value, desc, color }) {
  return (
    <Card className="border border-border/50 shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className={`text-3xl font-bold ${color || ""}`}>
        {value}
      </CardContent>
    </Card>
  );
}
