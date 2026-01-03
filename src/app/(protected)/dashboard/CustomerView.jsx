"use client";
import Slider from "@/components/Slider";
import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, ClipboardList, CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newJob, setNewJob] = useState({
    title: "",
    service_type: "",
    property_address: "",
  });

  const clerkId = user?.id;
  const role = user?.publicMetadata?.role || "client";

  // ========================================
  // SUPABASE AUTH CLIENT
  // ========================================
  const createSupabaseClient = useCallback(async () => {
    if (!isLoaded) return null;
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("No token from Clerk");

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );
  }, [getToken, isLoaded]);

  // ========================================
  // LOAD JOBS
  // ========================================
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

  // ========================================
  // CREATE JOB REQUEST
  // ========================================
  const createJobRequest = useCallback(
    async (newJob) => {
      try {
        setLoading(true);

        const res = await fetch("/api/jobs/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: newJob.title,
            service_type: newJob.service_type,
            property_address: newJob.property_address,
            assigned_client: clerkId,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create job");

        toast.success("✅ Request submitted successfully!");
        await fetchJobs();
        setNewJob({ title: "", service_type: "", property_address: "" });
      } catch (err) {
        console.error("❌ Error creating job request:", err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    },
    [clerkId, fetchJobs]
  );

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (role !== "client" && role !== "customer") return;
    fetchJobs();
  }, [isLoaded, user, role, fetchJobs]);

  // ========================================
  // STATS
  // ========================================
  const stats = useMemo(() => {
    const total = jobs.length;
    const pending = jobs.filter((j) => j.status === "pending").length;
    const inProgress = jobs.filter((j) => j.status === "in_progress").length;
    const completed = jobs.filter((j) => j.status === "completed").length;

    return { total, pending, inProgress, completed };
  }, [jobs]);

  // ========================================
  // WEEKLY CHART DATA
  // ========================================
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

  // ========================================
  // LOADING STATE
  // ========================================
  if (!isLoaded || loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );

  // ========================================
  // UI
  // ========================================
  return (
    <main className="pt-6 md:pt-10 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          My Cleaning Dashboard
        </h2>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Requests"
          value={stats.total}
          desc="All my jobs"
          href="/jobs"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          desc="Awaiting start"
          color="text-yellow-600"
          href="/jobs?status=pending"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          desc="Currently active"
          color="text-blue-600"
          href="/jobs?status=in_progress"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          desc="Finished successfully"
          color="text-green-600"
          href="/jobs?status=completed"
        />
      </div>

      {/* WEEKLY CHART */}
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

      {/* RECENT JOBS */}
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
                  className="py-4 flex items-center justify-between gap-4 text-sm hover:bg-gray-50 rounded-lg px-2 transition cursor-pointer"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  {/* Slider */}
                  <div className="relative w-40 h-40 rounded-xl bg-gray-100 shadow-sm overflow-hidden flex-shrink-0 pointer-events-none">
                    <Slider jobId={job.id} mini disableFullscreen />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {job.title || "Untitled Job"}
                    </p>
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {job.created_at
                        ? new Date(job.created_at).toLocaleDateString()
                        : "No date set"}
                    </p>
                  </div>

                  {/* Status */}
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

/* ======================================================
   CLICKABLE STAT CARD (UPDATED)
====================================================== */
function StatCard({ title, value, desc, color, href }) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => href && router.push(href)}
      onKeyDown={(e) => e.key === "Enter" && href && router.push(href)}
      className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <Card className="border border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>

        <CardContent className={`text-3xl font-bold ${color || ""}`}>
          {value}
        </CardContent>
      </Card>
    </div>
  );
}
