"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Loader2, BarChart3, ClipboardList, CalendarDays } from "lucide-react";
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

export default function DashboardPage() {
  const { user } = useUser();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const role = user.publicMetadata?.role || "user";

    // 🔹 Solo staff y admin pueden ver el dashboard
    if (role !== "admin" && role !== "staff") {
      toast.error("Access denied");
      window.location.href = "/"; // o "/profile" según prefieras
      return;
    }

    fetchJobs();
  }, [user]);

  async function fetchJobs() {
    setLoading(true);

    const role = user?.publicMetadata?.role || "user";
    const clerkId = user?.id;

    let query = supabase
      .from("cleaning_jobs")
      .select("*")
      .order("scheduled_date", { ascending: true });

    if (role === "staff" && clerkId) {
      query = query.eq("assigned_to", clerkId);
    } else if (role === "user" || role === "customer") {
      // 🔹 Usuarios normales no deberían ver nada
      query = query.eq("id", "0"); // siempre vacío
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error fetching jobs:", error.message);
      toast.error("Error loading jobs");
    } else {
      setJobs(data || []);
    }

    setLoading(false);
  }

  const stats = useMemo(() => {
    const total = jobs.length;
    const pending = jobs.filter((j) => j.status === "pending").length;
    const inProgress = jobs.filter((j) => j.status === "in_progress").length;
    const completed = jobs.filter((j) => j.status === "completed").length;
    const approved = jobs.filter((j) => j.status === "approved").length;

    return { total, pending, inProgress, completed, approved };
  }, [jobs]);

  const weeklyData = useMemo(() => {
    const map = {};
    jobs.forEach((job) => {
      if (!job.scheduled_date) return;
      const date = new Date(job.scheduled_date);
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

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );

  return (
    <main className="pt-6 md:pt-10 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary" />
          Dashboard Overview
        </h1>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Total Jobs</CardTitle>
            <CardDescription>All jobs in the system</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {stats.total}
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Pending</CardTitle>
            <CardDescription>Awaiting start</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-yellow-600">
            {stats.pending}
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>In Progress</CardTitle>
            <CardDescription>Currently active</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-blue-600">
            {stats.inProgress}
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <CardDescription>Finished successfully</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-green-600">
            {stats.completed}
          </CardContent>
        </Card>
      </div>

      {/* 📈 Gráfico semanal */}
      <Card className="border border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
          <CardDescription>Completed vs Pending Jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyData.length === 0 ? (
            <p className="text-gray-500">No job data available yet.</p>
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

      {/* Últimos trabajos */}
      <Card className="border border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="w-5 h-5 text-primary" />
            Recent Jobs
          </CardTitle>
          <CardDescription>Last 5 created jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.slice(0, 5).length === 0 ? (
            <p className="text-gray-500 text-center">No recent jobs found.</p>
          ) : (
            <ul className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <li
                  key={job.id}
                  className="flex justify-between items-center border-b pb-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-gray-500" />
                    <span>{job.title}</span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      job.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : job.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {job.status.replace("_", " ")}
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
