"use client";

import Slider from "@/components/Slider";
import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, ClipboardList, CalendarDays } from "lucide-react";
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

/* ======================================================
   CUSTOMER DASHBOARD
====================================================== */
export default function CustomerDashboard() {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const clerkId = user?.id;

  const [profileId, setProfileId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ======================================================
     SUPABASE AUTH CLIENT
  ====================================================== */
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

  /* ======================================================
     LOAD PROFILE UUID (ONCE)
  ====================================================== */
  useEffect(() => {
    if (!isLoaded || !clerkId) return;

    const loadProfile = async () => {
      try {
        const supabase = await createSupabaseClient();
        if (!supabase) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("clerk_id", clerkId)
          .single();

        if (error) throw error;

        setProfileId(data.id);
      } catch (err) {
        console.error("❌ Profile not found:", err.message);
        toast.error("Profile not found for this user");
        setLoading(false);
      }
    };

    loadProfile();
  }, [isLoaded, clerkId, createSupabaseClient]);

  /* ======================================================
     LOAD JOBS (UUID SAFE)
  ====================================================== */
  useEffect(() => {
    if (!profileId) return;

    const loadJobs = async () => {
      try {
        setLoading(true);
        const supabase = await createSupabaseClient();
        if (!supabase) return;

        const { data, error } = await supabase
          .from("cleaning_jobs")
          .select("*")
          .eq("created_by", profileId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setJobs(data || []);
      } catch (err) {
        console.error("❌ Error fetching jobs:", err.message);
        toast.error("Error loading jobs");
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [profileId, createSupabaseClient]);

  /* ======================================================
     STATS
  ====================================================== */
  const stats = useMemo(() => {
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "pending").length,
      inProgress: jobs.filter((j) => j.status === "in_progress").length,
      completed: jobs.filter((j) => j.status === "completed").length,
    };
  }, [jobs]);

  /* ======================================================
     WEEKLY DATA
  ====================================================== */
  const weeklyData = useMemo(() => {
    const map = {};

    jobs.forEach((job) => {
      if (!job.created_at) return;

      const date = new Date(job.created_at);
      const key = date.toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
      });

      map[key] ||= { date: key, completed: 0, pending: 0 };

      if (job.status === "completed") map[key].completed++;
      if (job.status === "pending") map[key].pending++;
    });

    return Object.values(map);
  }, [jobs]);

  /* ======================================================
     LOADING
  ====================================================== */
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  /* ======================================================
     UI
  ====================================================== */
  return (
    <main className="pt-6 md:pt-10 max-w-7xl mx-auto space-y-10">
      <h2 className="text-3xl font-bold flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-primary" />
        My Cleaning Dashboard
      </h2>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Requests" value={stats.total} />
        <StatCard
          title="Pending"
          value={stats.pending}
          color="text-yellow-600"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          color="text-blue-600"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          color="text-green-600"
        />
      </div>

      {/* WEEKLY CHART */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
          <CardDescription>Completed vs Pending Jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyData.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              No job data available yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="#22c55e" />
                <Bar dataKey="pending" fill="#eab308" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* RECENT JOBS */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Last 10 jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              You haven’t created any service requests yet.
            </p>
          ) : (
            <ul className="divide-y">
              {jobs.slice(0, 10).map((job) => (
                <li
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="py-4 flex gap-4 hover:bg-gray-50 rounded-lg px-2 cursor-pointer"
                >
                  <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-gray-100">
                    <Slider jobId={job.id} mini disableFullscreen />
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold">
                      {job.title || "Untitled Job"}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100">
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
   STAT CARD
====================================================== */
function StatCard({ title, value, color }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className={`text-3xl font-bold ${color || ""}`}>
        {value}
      </CardContent>
    </Card>
  );
}
