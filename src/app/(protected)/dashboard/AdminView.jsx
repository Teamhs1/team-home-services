"use client";
import { useRouter } from "next/navigation";
import Slider from "@/components/Slider";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useMemo, useCallback } from "react";

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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
  const { isLoaded, user } = useUser();

  const [jobs, setJobs] = useState([]);

  const [loading, setLoading] = useState(true);

  // ✅ Cliente Supabase autenticado con Clerk

  // 🧾 Cargar trabajos con fotos
  const fetchJobs = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/jobs", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await res.json();
      setJobs(data || []);
    } catch (err) {
      console.error("❌ Error fetching jobs:", err);
      toast.error("Error loading jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    fetchJobs();
  }, [isLoaded]);

  // 💬 Cargar mensajes autenticado con Clerk

  // 🔁 Cargar datos iniciales

  // 🔄 Realtime para cambios en trabajos

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
      (a, b) => new Date(a.date) - new Date(b.date),
    );
  }, [jobs]);

  if (!isLoaded || loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );

  return (
    <main className="pt-24 md:pt-28 max-w-7xl mx-auto px-4 space-y-10">
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
        <StatCard
          title="Total Jobs"
          value={stats.total}
          desc="All jobs"
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
      </motion.div>

      {/* Weekly Performance */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
          <CardDescription>Job flow over time</CardDescription>
        </CardHeader>

        <CardContent className="h-[260px]">
          {weeklyData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No activity yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="completedGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                    <stop
                      offset="100%"
                      stopColor="#22c55e"
                      stopOpacity={0.05}
                    />
                  </linearGradient>

                  <linearGradient
                    id="pendingGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#facc15" stopOpacity={0.5} />
                    <stop
                      offset="100%"
                      stopColor="#facc15"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{
                    fontSize: "12px",
                    borderRadius: "8px",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#22c55e"
                  fill="url(#completedGradient)"
                  strokeWidth={2}
                />

                <Area
                  type="monotone"
                  dataKey="pending"
                  stroke="#facc15"
                  fill="url(#pendingGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Trabajos recientes */}
      <RecentJobs jobs={jobs} />
    </main>
  );
}

/* --- Subcomponentes --- */
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
      <Card className="shadow-sm border border-border/40">
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
    </div>
  );
}

function MiniCarousel({ photos }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!photos?.length || photos.length <= 1) return;
    const timer = setInterval(
      () => setIndex((prev) => (prev + 1) % photos.length),
      2500,
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
    <Card className="border border-border/40 shadow-sm">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Recent Jobs
            </CardTitle>
            <CardDescription className="text-xs">
              Latest activity across properties
            </CardDescription>
          </div>

          <Link
            href="/jobs"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      </CardHeader>

      {/* List */}
      <CardContent className="p-0">
        {jobs.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No jobs yet.
          </div>
        ) : (
          <div className="divide-y">
            {jobs.slice(0, 8).map((job) => (
              <div
                key={job.id}
                onClick={() => (window.location.href = `/jobs/${job.id}`)}
                className="group grid grid-cols-[1fr_auto_auto] gap-4
                           px-4 py-3 text-sm cursor-pointer
                           hover:bg-muted/40 transition"
              >
                {/* Title + address */}
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {job.title || "Untitled job"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {job.property_address || "No address"}
                  </p>
                </div>

                {/* Date */}
                <div className="hidden sm:flex items-center text-xs text-muted-foreground whitespace-nowrap">
                  {job.scheduled_date
                    ? new Date(job.scheduled_date).toLocaleDateString()
                    : "—"}
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium
                      ${
                        job.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : job.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                      }`}
                  >
                    {job.status?.replace("_", " ") || "unknown"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContactMessages({ messages, loading }) {
  const unreadCount = messages.filter((m) => !m.read).length;
  return (
    <Card className="border border-border/50 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">
          Weekly Performance
        </CardTitle>
        <CardDescription className="text-xs">
          Completed vs Pending jobs
        </CardDescription>
      </CardHeader>

      <CardContent className="h-[260px]">
        {weeklyData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No activity yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyData}
              barGap={6}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                contentStyle={{
                  fontSize: "12px",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="completed"
                radius={[4, 4, 0, 0]}
                className="fill-green-500"
              />
              <Bar
                dataKey="pending"
                radius={[4, 4, 0, 0]}
                className="fill-yellow-400"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
