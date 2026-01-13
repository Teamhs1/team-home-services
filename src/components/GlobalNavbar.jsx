"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser, useAuth } from "@clerk/nextjs"; // ✅ agregado useAuth
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

import { useSidebar } from "@/components/SidebarContext";
import { Bell, Sun, Moon } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { formatDistanceToNow } from "date-fns";

export default function GlobalNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen } = useSidebar?.() || {};
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth(); // ✅ Clerk token

  const [navBg, setNavBg] = useState(false);
  const [profileId, setProfileId] = useState(null); // ✅ UUID de profiles

  const [pendingCount, setPendingCount] = useState(0);
  const [recentApps, setRecentApps] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const dropdownRef = useRef(null);
  // 🔑 Load profile UUID (required for jobs filters)
  useEffect(() => {
    if (!isLoaded || !user?.id) return;

    const loadProfileId = async () => {
      try {
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("clerk_id", user.id)
          .single();

        if (error) throw error;
        setProfileId(data.id);
      } catch (err) {
        console.error("❌ Navbar profileId error:", err.message);
      }
    };

    loadProfileId();
  }, [isLoaded, user?.id]);

  // 🎨 Sidebar Theme (light / dark) — sin romper darkMode
  const [sidebarTheme, setSidebarTheme] = useState("light");

  useEffect(() => {
    const syncSidebarTheme = () => {
      const stored = localStorage.getItem("sidebarTheme") || "light";
      setSidebarTheme(stored);
    };

    syncSidebarTheme();
    const interval = setInterval(syncSidebarTheme, 500);
    return () => clearInterval(interval);
  }, []);

  const role = isLoaded ? user?.publicMetadata?.role || "user" : "user";

  // ✅ Crear cliente autenticado con Clerk
  async function getSupabaseClient() {
    const token = await getToken({ template: "supabase" });
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );
  }

  // 🩹 Refrescar sesión Clerk
  useEffect(() => {
    if (!isLoaded) return;
    try {
      user?.reload?.();
    } catch (err) {
      console.warn("⚠️ Clerk session reload failed:", err);
    }
  }, [isLoaded]);

  // 🧭 Scroll transparente en landing
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
    const supabase = await getSupabaseClient(); // ✅ token Clerk
    const { data, count, error } = await supabase
      .from("staff_applications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error) {
      setPendingCount(count || 0);
      setRecentApps(data || []);
    } else {
      console.error("❌ Error fetching staff apps:", error.message);
    }
  }

  // 👷 Staff: cargar jobs pendientes asignados a sí mismo
  async function fetchPendingJobs() {
    if (role !== "staff" || !profileId) return;

    const supabase = await getSupabaseClient();
    const { data, count, error } = await supabase
      .from("cleaning_jobs")
      .select("*", { count: "exact" })
      .eq("assigned_to", profileId) // ✅ FIX
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
    if (role !== "client" || !profileId) return;

    const supabase = await getSupabaseClient();
    const { data, count, error } = await supabase
      .from("cleaning_jobs")
      .select("*", { count: "exact" })
      .eq("created_by", profileId) // ✅ FIX
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
    getSupabaseClient().then((supabase) => {
      const channel = supabase
        .channel("staff_applications_navbar")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "staff_applications" },
          () => fetchStaffApplications()
        )
        .subscribe();
      return () => supabase.removeChannel(channel);
    });
  }, [role]);

  // 🔄 Escucha realtime de cleaning_jobs (admin + staff + client)
  useEffect(() => {
    if (!["admin", "staff", "client"].includes(role)) return;
    if (role === "admin") return;

    if (role === "staff") fetchPendingJobs();
    if (role === "client") fetchClientPendingJobs();

    getSupabaseClient().then((supabase) => {
      const channel = supabase
        .channel("navbar-jobs-updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cleaning_jobs" },
          (payload) => {
            console.log("🧩 Job change detected:", payload);
            if (role === "admin") fetchStaffApplications();
            if (role === "staff" && payload.new?.assigned_to === profileId)
              fetchPendingJobs();
            if (role === "client" && payload.new?.created_by === profileId)
              fetchClientPendingJobs();
          }
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    });
  }, [role, user, profileId]);

  // 🔹 Config visual
  const baseClasses =
    "fixed top-0 left-0 z-[40] w-full flex items-center justify-between transition-all duration-500 border-b";

  const bgClass =
    pathname === "/"
      ? navBg
        ? "backdrop-blur-md shadow-sm " +
          (sidebarTheme === "dark"
            ? "bg-slate-900/90 border-slate-800 text-white"
            : "bg-white/90 border-gray-200 text-gray-900")
        : "bg-transparent border-transparent text-white"
      : sidebarTheme === "dark"
      ? "bg-slate-900 border-slate-800 text-white shadow-sm"
      : "bg-white border-gray-200 text-gray-900 shadow-sm";

  const isPrivatePage =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/jobs") ||
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/settings");

  // Detectar mobile (para ignorar sidebar)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // En mobile → navbar siempre 100% ancho y sin márgenes
  const marginLeft = isMobile
    ? "0"
    : isPrivatePage
    ? isSidebarOpen
      ? "16rem"
      : "5rem"
    : "0";

  const width = isMobile
    ? "100%"
    : isPrivatePage
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
              className="rounded-md transition-transform duration-300 group-hover:scale-105"
            />

            <span className="font-semibold text-lg tracking-tight whitespace-nowrap group-hover:text-blue-600 transition-colors">
              Team Home Services
            </span>
          </Link>
        )}

        {/* 🔹 CENTRO */}
        <div
          className={`hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-sm font-medium transition-colors
${
  pathname === "/" && !navBg
    ? "text-white"
    : sidebarTheme === "dark"
    ? "text-white"
    : "text-gray-800"
}`}
        >
          <a href="/#about" className="hover:text-blue-600 transition-colors">
            About
          </a>

          <a
            href="/#services"
            className="hover:text-blue-600 transition-colors"
          >
            Services
          </a>

          {/* 🔐 RENTALS — solo admin */}
          {role === "admin" && (
            <Link
              href="/rentals"
              className={`relative hover:text-blue-600 transition-colors ${
                pathname.startsWith("/rentals")
                  ? "text-blue-600 font-semibold"
                  : ""
              }`}
            >
              Rentals
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                Admin
              </span>
            </Link>
          )}

          <a href="/#contact" className="hover:text-blue-600 transition-colors">
            Contact
          </a>
        </div>

        {/* 🔹 DERECHA */}
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
                      : sidebarTheme === "dark"
                      ? "text-slate-300 hover:text-blue-400"
                      : "text-gray-700 hover:text-blue-600"
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
                    {/* 🧩 Notificaciones */}
                    <div className="p-4 border-b bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {role === "admin"
                          ? "Staff Applications"
                          : role === "staff"
                          ? "Assigned Jobs"
                          : "Your Pending Jobs"}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {pendingCount} pending
                      </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {recentJobs.length > 0 || recentApps.length > 0 ? (
                        (role === "admin" ? recentApps : recentJobs).map(
                          (item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (role === "admin")
                                  router.push(`/admin/staff-applications`);
                                if (role === "staff")
                                  router.push(`/jobs/${item.id}`);
                                if (role === "client")
                                  router.push(`/jobs/${item.id}`);
                                setDropdownOpen(false);
                              }}
                              className="px-4 py-3 border-b dark:border-gray-800 cursor-pointer 
             hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm 
             flex flex-col gap-1 group"
                            >
                              {/* Título */}
                              <p className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 transition">
                                {item.title ||
                                  item.property_address ||
                                  item.full_name ||
                                  "New activity"}
                              </p>

                              {/* Badge + tiempo */}
                              <div className="flex items-center justify-between">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold
      ${
        item.status === "pending"
          ? "bg-yellow-100 text-yellow-700"
          : item.status === "in_progress"
          ? "bg-blue-100 text-blue-700"
          : "bg-green-100 text-green-700"
      }`}
                                >
                                  {item.status?.replace("_", " ") || "update"}
                                </span>

                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(
                                    new Date(item.created_at),
                                    { addSuffix: true }
                                  )}
                                </span>
                              </div>

                              {/* Preview opcional */}
                              {item.property_address && (
                                <p className="text-gray-500 text-xs">
                                  {item.property_address.length > 40
                                    ? item.property_address.slice(0, 40) + "..."
                                    : item.property_address}
                                </p>
                              )}
                            </div>
                          )
                        )
                      ) : (
                        <p className="text-center text-gray-500 text-sm py-6">
                          No pending items
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 👤 Usuario */}
          {isLoaded ? (
            user ? (
              <>
                {!isPrivatePage && (
                  <button
                    onClick={() => router.push("/dashboard")}
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
