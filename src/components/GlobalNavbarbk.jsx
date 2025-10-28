"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useSidebar } from "@/components/SidebarContext";
import { Bell, Sun, Moon } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { formatDistanceToNow } from "date-fns";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GlobalNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen } = useSidebar?.() || {};
  const { user, isLoaded } = useUser();

  const [navBg, setNavBg] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [recentApps, setRecentApps] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const dropdownRef = useRef(null);

  const role = isLoaded ? user?.publicMetadata?.role || "user" : "user";

  // 🩹 Refrescar sesión para evitar estado inválido de Clerk
  useEffect(() => {
    if (!isLoaded) return;
    try {
      user?.reload?.();
    } catch (err) {
      console.warn("⚠️ Clerk session reload failed:", err);
    }
  }, [isLoaded]);

  // 🧭 Detectar scroll solo en la landing
  useEffect(() => {
    if (pathname !== "/") return;
    const handleScroll = () => setNavBg(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // 🚪 Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🌙 Sincronizar dark mode
  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setDarkMode(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
  };

  // 🧩 Admin: cargar solicitudes pendientes
  async function fetchStaffApplications() {
    if (role !== "admin") return;
    const { data, count, error } = await supabase
      .from("staff_applications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(5)
      .eq("status", "pending");

    if (!error) {
      setPendingCount(count || 0);
      setRecentApps(data || []);
    }
  }

  // 👷 Staff: cargar jobs pendientes asignados a sí mismo
  async function fetchPendingJobs() {
    if (role !== "staff") return;
    const { data, count, error } = await supabase
      .from("cleaning_jobs")
      .select("*", { count: "exact" })
      .eq("assigned_to", user?.id)
      .eq("status", "pending")
      .order("scheduled_date", { ascending: true })
      .limit(5);

    if (!error) {
      setPendingCount(count || 0);
      setRecentJobs(data || []);
    }
  }

  // 👤 Client: cargar sus propios trabajos pendientes
  async function fetchClientPendingJobs() {
    if (role !== "client") return;
    const { data, count, error } = await supabase
      .from("cleaning_jobs")
      .select("*", { count: "exact" })
      .eq("created_by", user?.id)
      .eq("status", "pending")
      .order("scheduled_date", { ascending: true })
      .limit(5);

    if (!error) {
      setPendingCount(count || 0);
      setRecentJobs(data || []);
    }
  }

  // 🔄 Escucha en tiempo real de staff_applications (admin)
  useEffect(() => {
    if (role !== "admin") return;
    fetchStaffApplications();
    const channel = supabase
      .channel("staff_applications_navbar")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff_applications" },
        () => fetchStaffApplications()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [role]);

  // 🔄 Escucha en tiempo real de cleaning_jobs (staff + admin)
  useEffect(() => {
    if (role !== "admin" && role !== "staff") return;

    if (role === "staff") fetchPendingJobs();

    const channel = supabase
      .channel("navbar-jobs-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleaning_jobs" },
        (payload) => {
          console.log("🧩 Job change detected:", payload);

          if (role === "admin") fetchStaffApplications();
          if (role === "staff" && payload.new?.assigned_to === user?.id) {
            fetchPendingJobs();
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [role, user]);

  // 🔹 Config visual
  const baseClasses =
    "fixed top-0 left-0 z-[40] w-full flex items-center justify-between transition-all duration-500 border-b";
  const bgClass =
    pathname === "/"
      ? navBg
        ? "bg-white/90 backdrop-blur-md border-gray-200 text-gray-900 shadow-sm dark:bg-gray-900/90 dark:border-gray-700 dark:text-white"
        : "bg-transparent border-transparent text-white"
      : "bg-white border-gray-200 text-gray-900 shadow-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white";

  const isPrivatePage =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/jobs") ||
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/settings");

  const marginLeft = isPrivatePage ? (isSidebarOpen ? "16rem" : "5rem") : "0";
  const width = isPrivatePage
    ? isSidebarOpen
      ? "calc(100% - 16rem)"
      : "calc(100% - 5rem)"
    : "100%";

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`${baseClasses} ${bgClass} px-8 md:px-12 py-4`}
      style={{ marginLeft, width }}
    >
      <div className="flex items-center w-full justify-between">
        {/* 🔹 IZQUIERDA: Logo */}
        {!isPrivatePage && (
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 group hover:opacity-90 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="Team Home Services Logo"
              width={40}
              height={40}
              priority
              className={`rounded-md transition-transform duration-300 group-hover:scale-105 ${
                pathname === "/" && !navBg ? "brightness-0 invert" : ""
              }`}
            />
            <span className="font-semibold text-lg tracking-tight whitespace-nowrap group-hover:text-blue-600 transition-colors">
              Team Home Services
            </span>
          </Link>
        )}

        {/* 🔹 CENTRO: Links principales */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-sm font-medium">
          <a href="/#about" className="hover:text-blue-600 transition-colors">
            About
          </a>
          <a
            href="/#services"
            className="hover:text-blue-600 transition-colors"
          >
            Services
          </a>
          <a href="/#contact" className="hover:text-blue-600 transition-colors">
            Contact
          </a>
        </div>

        {/* 🔹 DERECHA: Controles */}
        <div
          className="flex items-center gap-4 ml-auto justify-end"
          ref={dropdownRef}
        >
          {/* 🔔 Notificaciones para todos los roles */}
          {(role === "admin" || role === "staff" || role === "client") && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Notifications"
              >
                <Bell
                  size={22}
                  className={`transition ${
                    pathname === "/" && !navBg
                      ? "text-white"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600"
                  }`}
                />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-[999]"
                  >
                    {role === "admin" ? (
                      <>
                        <div className="p-4 border-b bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Staff Applications
                          </h3>
                          <span className="text-xs text-gray-500">
                            {pendingCount} pending
                          </span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {recentApps.length > 0 ? (
                            recentApps.map((app) => (
                              <div
                                key={app.id}
                                className="px-4 py-3 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm"
                              >
                                <p className="font-medium text-gray-800 dark:text-gray-100">
                                  {job.property_address ||
                                    job.property_name ||
                                    "No address available"}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                  {job.status === "pending"
                                    ? "Awaiting completion"
                                    : job.status === "in_progress"
                                    ? "In progress"
                                    : job.status === "completed"
                                    ? "Completed"
                                    : "Unknown status"}
                                </p>

                                <p className="text-xs text-gray-500">
                                  {formatDistanceToNow(
                                    new Date(app.created_at),
                                    {
                                      addSuffix: true,
                                    }
                                  )}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-gray-500 text-sm py-6">
                              No pending applications
                            </p>
                          )}
                        </div>
                        <div className="p-3 border-t bg-gray-50 dark:bg-gray-800 text-center">
                          <Link
                            href="/admin/staff-applications"
                            className="text-sm font-medium text-blue-600 hover:underline"
                            onClick={() => setDropdownOpen(false)}
                          >
                            View All Applications
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 border-b bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Assigned Jobs
                          </h3>
                          <span className="text-xs text-gray-500">
                            {pendingCount} pending
                          </span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {recentJobs.length > 0 ? (
                            recentJobs.map((job) => {
                              const getStatusIcon = (status) => {
                                switch (status) {
                                  case "pending":
                                    return (
                                      <span className="inline-block w-2.5 h-2.5 bg-yellow-400 rounded-full mr-2"></span>
                                    );
                                  case "in_progress":
                                    return (
                                      <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-full mr-2"></span>
                                    );
                                  case "completed":
                                    return (
                                      <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>
                                    );
                                  default:
                                    return (
                                      <span className="inline-block w-2.5 h-2.5 bg-gray-400 rounded-full mr-2"></span>
                                    );
                                }
                              };

                              const formattedStatus =
                                job.status === "pending"
                                  ? "Awaiting confirmation"
                                  : job.status === "in_progress"
                                  ? "In progress"
                                  : job.status === "completed"
                                  ? "Completed"
                                  : "Unknown status";

                              return (
                                <div
                                  key={job.id}
                                  className="px-4 py-3 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm"
                                >
                                  {/* 🏠 Línea principal: título o dirección */}
                                  <p className="font-medium text-gray-800 dark:text-gray-100 flex items-center">
                                    {getStatusIcon(job.status)}
                                    {job.title ||
                                      job.property_address ||
                                      "Untitled Job"}
                                  </p>

                                  {/* 📅 Línea secundaria: estado + fecha */}
                                  <p className="text-xs text-gray-500 capitalize ml-4">
                                    {formattedStatus}{" "}
                                    {job.scheduled_date && (
                                      <>
                                        {" • "}
                                        {formatDistanceToNow(
                                          new Date(job.scheduled_date),
                                          {
                                            addSuffix: true,
                                          }
                                        )}
                                      </>
                                    )}
                                  </p>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-center text-gray-500 text-sm py-6">
                              No pending jobs
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 🌗 Modo oscuro 
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? (
              <Sun size={20} className="text-yellow-400" />
            ) : (
              <Moon size={20} className="text-gray-700 dark:text-gray-300" />
            )}
          </button>*/}

          {/* 👤 Usuario */}
          {isLoaded ? (
            user ? (
              <>
                {!isPrivatePage && (
                  <button
                    onClick={() => {
                      if (role === "admin" || role === "staff")
                        router.push("/dashboard");
                      else router.push("/dashboard");
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Go to Dashboard
                  </button>
                )}
                <div suppressHydrationWarning>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{ elements: { avatarBox: "w-8 h-8" } }}
                  />
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition text-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-md bg-white/90 px-4 py-2 text-blue-700 hover:bg-white transition text-sm"
                >
                  Sign Up
                </Link>
              </>
            )
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          )}
        </div>
      </div>
    </motion.nav>
  );
}
