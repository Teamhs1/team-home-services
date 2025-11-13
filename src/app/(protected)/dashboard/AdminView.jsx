"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Loader2,
  BarChart3,
  ClipboardList,
  ArrowRight,
  Mail,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
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
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const role = user?.publicMetadata?.role || "user";

  // ✅ Cliente Supabase autenticado con Clerk
  const getSupabase = useCallback(async () => {
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("No token from Clerk");
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
  }, [getToken]);

  // 🧾 Cargar trabajos con fotos
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = await getSupabase();

      const { data, error } = await supabase
        .from("cleaning_jobs")
        .select(`*, job_photos (id, image_url)`)
        .order("scheduled_date", { ascending: false });

      if (error) throw error;

      const normalizeUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        const clean = path
          .replace(/^\/?job-photos\//, "")
          .replace(/^storage\/v1\/object\/public\/job-photos\//, "")
          .trim();
        return `${
          process.env.NEXT_PUBLIC_SUPABASE_URL
        }/storage/v1/object/public/job-photos/${encodeURIComponent(clean)}`;
      };

      const jobsWithUrls = (data || []).map((job) => ({
        ...job,
        job_photos: (job.job_photos || []).map((photo) => ({
          ...photo,
          image_url: normalizeUrl(photo.image_url),
        })),
      }));

      setJobs(jobsWithUrls);
    } catch (err) {
      console.error("❌ Error fetching jobs:", err);
      toast.error("Error loading jobs: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getSupabase]);

  // 💬 Cargar mensajes autenticado con Clerk
  const fetchMessages = useCallback(async () => {
    try {
      setLoadingMessages(true);

      // ✅ Cliente Supabase autenticado con Clerk
      const token = await getToken({ template: "supabase" });
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        token
          ? { global: { headers: { Authorization: `Bearer ${token}` } } }
          : undefined
      );

      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
      toast.error("Failed to load messages: " + err.message);
    } finally {
      setLoadingMessages(false);
    }
  }, [getToken]);

  // 🔁 Cargar datos iniciales
  useEffect(() => {
    if (!isLoaded) return;
    if (role !== "admin") return;
    const loadAll = async () => {
      await fetchJobs();
      await fetchMessages();
    };
    loadAll();
  }, [isLoaded, role, fetchJobs, fetchMessages]);

  // 🔄 Realtime para cambios en trabajos
  useEffect(() => {
    if (role !== "admin") return;
    const initRealtime = async () => {
      try {
        const token = await window?.Clerk?.session?.getToken({
          template: "supabase",
        });
        if (!token) return;

        const supabaseRealtime = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        await supabaseRealtime.auth.setSession({ access_token: token });

        const channel = supabaseRealtime
          .channel("admin_dashboard_jobs")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "cleaning_jobs" },
            async (payload) => {
              await fetchJobs();
              const job = payload.new;
              switch (payload.eventType) {
                case "INSERT":
                  toast.info("🧾 New job created!", {
                    description: job?.title || "New job added.",
                  });
                  break;
                case "UPDATE":
                  if (job.status === "in_progress")
                    toast.info("🚀 Job started", { description: job?.title });
                  else if (job.status === "completed")
                    toast.success("✨ Job completed!", {
                      description: job?.title,
                    });
                  else
                    toast.message("🔁 Job updated", {
                      description: job?.title,
                    });
                  break;
                case "DELETE":
                  toast.warning("🗑️ Job deleted");
                  break;
              }
            }
          )
          .subscribe();

        return () => {
          supabaseRealtime.removeChannel(channel);
        };
      } catch (err) {
        console.error("❌ Realtime error:", err);
      }
    };
    initRealtime();
  }, [role, fetchJobs]);

  // 📊 Métricas
  const stats = useMemo(() => {
    const total = jobs.length;
    const pending = jobs.filter((j) => j.status === "pending").length;
    const inProgress = jobs.filter((j) => j.status === "in_progress").length;
    const completed = jobs.filter((j) => j.status === "completed").length;
    return { total, pending, inProgress, completed };
  }, [jobs]);

  // 📈 Gráfico semanal
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

  if (!isLoaded || loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );

  return (
    <main className="pt-6 md:pt-10 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary" /> Dashboard Overview
        </h2>
      </motion.div>

      {/* Métricas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard title="Total Jobs" value={stats.total} desc="All jobs" />
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
      </motion.div>

      {/* Gráfico */}
      <Card className="border border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
          <CardDescription>Completed vs Pending Jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Loader2 className="animate-spin w-6 h-6 mb-2 text-primary" />
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-gray-500">No contact messages yet.</p>
            </div>
          ) : (
            <>
              <ul className="divide-y">
                {messages.slice(0, 5).map((msg) => (
                  <li
                    key={msg.id}
                    className="py-4 px-2 hover:bg-gray-50 rounded transition"
                  >
                    <p className="font-semibold text-gray-900 flex items-center justify-between">
                      {msg.name}
                      {!msg.read && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full ml-2">
                          New
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">{msg.email}</p>
                    <p className="mt-1 text-gray-700">{msg.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>

              {/* 🔹 Botón siempre visible */}
              <div className="flex justify-center pt-6">
                <Link href="/admin/messages">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 hover:bg-primary/10"
                  >
                    View All Messages <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Trabajos recientes */}
      <RecentJobs jobs={jobs} />
    </main>
  );
}

/* --- Subcomponentes --- */

function StatCard({ title, value, desc, color }) {
  return (
    <Card className="shadow-sm border border-border/40 hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={`text-3xl font-bold ${color || ""}`}>
        {value}
      </CardContent>
      <CardDescription className="px-6 pb-4 text-xs text-gray-500">
        {desc}
      </CardDescription>
    </Card>
  );
}

function MiniCarousel({ photos }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!photos?.length || photos.length <= 1) return;
    const timer = setInterval(
      () => setIndex((prev) => (prev + 1) % photos.length),
      2500
    );
    return () => clearInterval(timer);
  }, [photos]);
  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={photos[index]?.id || index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <Image
            src={photos[index]?.image_url}
            alt={`photo ${index + 1}`}
            fill
            className="object-cover"
            sizes="112px"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function RecentJobs({ jobs }) {
  return (
    <Card className="border border-border/50 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="w-5 h-5 text-primary" /> Recent Jobs
        </CardTitle>
        <CardDescription>Last 10 created jobs</CardDescription>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No jobs found in the system.
          </p>
        ) : (
          <ul className="divide-y">
            {jobs.slice(0, 10).map((job) => {
              const photos = job.job_photos || [];
              return (
                <li
                  key={job.id}
                  onClick={(e) => {
                    const tag = e.target.tagName.toLowerCase();
                    if (["button", "svg", "path"].includes(tag)) return;
                    window.location.href = `/jobs/${job.id}`;
                  }}
                  className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-3 hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative w-28 h-20 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                      {photos.length > 0 ? (
                        <MiniCarousel photos={photos} />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{job.title || "Untitled"}</p>
                      <p className="text-gray-500 text-xs">
                        {job.scheduled_date
                          ? new Date(job.scheduled_date).toLocaleDateString()
                          : "No date set"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`self-end sm:self-auto px-2 py-1 rounded-full text-xs font-semibold ${
                      job.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : job.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {job.status?.replace("_", " ") || "unknown"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex justify-center pt-6">
          <Link href="/jobs">
            <Button className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2">
              View All Jobs <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ContactMessages({ messages, loading }) {
  const unreadCount = messages.filter((m) => !m.read).length;
  return (
    <Card className="border border-border/50 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="w-5 h-5 text-primary" /> Contact Messages
            </CardTitle>
            <CardDescription>
              Latest messages from your site form
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Loader2 className="animate-spin w-6 h-6 mb-2 text-primary" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-gray-500">No contact messages yet.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {messages.slice(0, 5).map((msg) => (
              <li
                key={msg.id}
                className="py-4 px-2 hover:bg-gray-50 rounded transition"
              >
                <p className="font-semibold text-gray-900 flex items-center justify-between">
                  {msg.name}
                  {!msg.read && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full ml-2">
                      New
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-600">{msg.email}</p>
                <p className="mt-1 text-gray-700">{msg.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
        {messages.length > 5 && (
          <div className="flex justify-center pt-6">
            <Link href="/admin/messages">
              <Button
                variant="outline"
                className="flex items-center gap-2 hover:bg-primary/10"
              >
                View All Messages <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
