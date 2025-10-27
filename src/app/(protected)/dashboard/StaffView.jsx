"use client";

import SafeClerkWrapper from "@/components/SafeClerkWrapper";
import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Loader2,
  ClipboardList,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  Clock,
  Bell,
  Volume2,
} from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

export default function StaffView() {
  return (
    <SafeClerkWrapper>
      {({ user, role }) => <StaffDashboard user={user} role={role} />}
    </SafeClerkWrapper>
  );
}

function StaffDashboard({ user, role }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentJobs, setRecentJobs] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const dropdownRef = useRef(null);

  // 🛠️ Sonido tipo “ping”
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // tono A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // volumen suave

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.25); // duración breve
    } catch (err) {
      console.warn("🔇 Audio playback blocked by browser:", err.message);
    }
  };

  // 🔐 Verificación de acceso
  useEffect(() => {
    if (!user) return;
    if (role !== "staff") {
      toast.error("Access denied");
      window.location.href = "/";
      return;
    }
    fetchJobs();
  }, [user, role]);

  // 📦 Cargar trabajos
  async function fetchJobs() {
    setLoading(true);
    const staffId = user?.id;
    const { data, error } = await supabase
      .from("cleaning_jobs")
      .select("*")
      .eq("assigned_to", staffId)
      .order("scheduled_date", { ascending: true });

    if (error) {
      console.error("❌ Error fetching jobs:", error.message);
      toast.error("Error loading assigned jobs");
    } else {
      setJobs(data || []);
      setRecentJobs(data.slice(0, 5));
    }
    setLoading(false);
  }

  // 🔔 Realtime listener
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("staff-job-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleaning_jobs" },
        (payload) => {
          const job = payload.new;
          if (job?.assigned_to === user.id) {
            toast.success("🧹 New job assigned to you!");
            playNotificationSound();
            fetchJobs();
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id, soundEnabled]);

  // 📊 Stats
  const stats = useMemo(() => {
    const total = jobs.length;
    const pending = jobs.filter((j) => j.status === "pending").length;
    const inProgress = jobs.filter((j) => j.status === "in_progress").length;
    const completed = jobs.filter((j) => j.status === "completed").length;
    return { total, pending, inProgress, completed };
  }, [jobs]);

  // 📅 Weekly chart
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

  // 🚪 Click fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );

  return (
    <main className="pt-6 md:pt-10 max-w-7xl mx-auto space-y-10">
      {/* Header con campana y sonido */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <BarChart3 className="w-7 h-7 text-primary" />
            My Work Overview
          </h1>
          <p className="text-sm text-gray-500">
            Welcome back, {user?.firstName || "Team Member"} 👋
          </p>
        </div>

        <div className="flex items-center gap-3" ref={dropdownRef}>
          {/* 🔊 Botón para activar/desactivar sonido */}
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? "Sound On" : "Sound Off"}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
              soundEnabled
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            <Volume2 size={20} />
          </button>

          {/* 🔔 Dropdown de notificaciones */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Bell className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            {recentJobs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {recentJobs.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-12 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-[999]"
              >
                <div className="p-4 border-b bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Recent Assigned Jobs
                  </h3>
                  <span className="text-xs text-gray-500">
                    {recentJobs.length} total
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {recentJobs.length > 0 ? (
                    recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="px-4 py-3 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm"
                      >
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          {job.property_address || job.title || "Unnamed Job"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Scheduled:{" "}
                          {new Date(job.scheduled_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 text-sm py-6">
                      No recent jobs assigned
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<ClipboardList className="text-primary" />}
          label="Assigned Jobs"
          value={stats.total}
        />
        <StatCard
          icon={<Clock className="text-yellow-500" />}
          label="Pending"
          value={stats.pending}
        />
        <StatCard
          icon={<CheckCircle2 className="text-green-600" />}
          label="Completed"
          value={stats.completed}
        />
        <StatCard
          icon={<CalendarDays className="text-blue-600" />}
          label="Upcoming"
          value={
            jobs.filter((j) => new Date(j.scheduled_date) > new Date()).length
          }
        />
      </div>

      {/* 📈 Weekly Progress */}
      <Card className="border border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Weekly Progress</CardTitle>
          <CardDescription>Completed vs Pending</CardDescription>
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
    </main>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <Card className="border border-border/50 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {label}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
