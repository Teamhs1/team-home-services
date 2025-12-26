"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  User,
  Settings,
  Palette,
  Users,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  FileSpreadsheet,
  FileClock,
  AlertCircle,
  Mail,
  Key,
  Building,
  ShieldCheck,
} from "lucide-react";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useSidebar } from "@/components/SidebarContext";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 🎨 Sidebar themes
const SIDEBAR_THEMES = {
  light: {
    aside: "bg-white border-gray-200 text-gray-800",
    hover:
      "hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent hover:text-blue-600",
    active: "bg-blue-50 text-blue-600 border-blue-600",
  },
  dark: {
    aside: "bg-slate-900 border-slate-800 text-slate-200",
    hover:
      "hover:bg-gradient-to-r hover:from-slate-800 hover:to-transparent hover:text-white",
    active: "bg-slate-800 text-white border-blue-500",
  },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen: isOpen, toggleSidebar } = useSidebar();
  const { user, isLoaded } = useUser();
  const { session } = useClerk();

  const [role, setRole] = useState("user");
  const [hasSyncError, setHasSyncError] = useState(false);
  const [sidebarTheme, setSidebarTheme] = useState("dark");

  // 🟢 NUEVO: permisos para STAFF
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const syncTheme = () => {
      const stored = localStorage.getItem("sidebarTheme") || "dark";
      setSidebarTheme(stored);
    };

    syncTheme();
    const interval = setInterval(syncTheme, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      setRole(user.publicMetadata?.role || "user");
    }
  }, [isLoaded, user]);

  useEffect(() => {
    async function checkRoleFromSupabase() {
      if (!user?.id) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("clerk_id", user.id)
        .single();

      if (data?.role && data.role !== role) setRole(data.role);
    }

    const interval = setInterval(checkRoleFromSupabase, 5000);
    return () => clearInterval(interval);
  }, [user, role]);

  useEffect(() => {
    if (role !== "admin") return;

    async function checkRecentSyncErrors() {
      const since = new Date();
      since.setDate(since.getDate() - 1);

      const { data } = await supabase
        .from("sync_logs")
        .select("id")
        .eq("status", "error")
        .gte("created_at", since.toISOString())
        .limit(1);

      setHasSyncError(data?.length > 0);
    }

    checkRecentSyncErrors();
    const interval = setInterval(checkRecentSyncErrors, 30000);
    return () => clearInterval(interval);
  }, [role]);

  // 🟢 CARGAR PERMISOS DE STAFF
  useEffect(() => {
    async function loadStaffPermissions() {
      if (role !== "staff" || !user?.id) {
        console.warn(
          "⏭️ No se cargan permisos: rol no es staff o user no está cargado"
        );
        return;
      }

      console.log("🔎 Cargando perfil de Supabase para:", user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

      if (profileError) {
        console.error("❌ Error al obtener perfil:", profileError.message);
        return;
      }

      if (!profile?.id) {
        console.warn("⚠️ No se encontró el perfil con ese clerk_id");
        return;
      }

      console.log("✅ ID de perfil staff:", profile.id);

      const { data: permissionsData, error: permissionError } = await supabase
        .from("staff_permissions")
        .select("resource")
        .eq("staff_profile_id", profile.id);

      if (permissionError) {
        console.error("❌ Error al cargar permisos:", permissionError.message);
        return;
      }

      console.log("📦 Permisos encontrados:", permissionsData);

      setPermissions(permissionsData?.map((p) => p.resource) || []);
    }

    loadStaffPermissions();
  }, [role, user]);

  /* =========================
     MENU BASE
  ========================= */
  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },

    // Mostrar solo si el permiso existe
    ...(role === "staff" && permissions.includes("jobs")
      ? [{ name: "Jobs", href: "/jobs", icon: ClipboardList }]
      : []),

    ...(role === "staff" && permissions.includes("properties")
      ? [
          {
            name: "Properties",
            href: "/dashboard/properties",
            icon: Building,
          },
        ]
      : []),

    ...(role === "staff" && permissions.includes("keys")
      ? [{ name: "Keys", href: "/dashboard/keys", icon: Key }]
      : []),

    ...(role === "admin"
      ? [
          { name: "Messages", href: "/admin/messages", icon: Mail },
          {
            name: "Edit Landing Content",
            href: "/admin/content",
            icon: FileEdit,
          },
          {
            name: "Staff Applications",
            href: "/admin/staff-applications",
            icon: FileSpreadsheet,
          },
          {
            name: "Sync Logs",
            href: "/admin/sync-logs",
            icon: FileClock,
            hasError: hasSyncError,
          },
          {
            name: "Properties",
            href: "/admin/properties",
            icon: ClipboardList,
          },
          { name: "Companies", href: "/admin/companies", icon: Building },
          { name: "Keys", href: "/admin/keys", icon: Key },
          {
            name: "Permissions",
            href: "/admin/permissions",
            icon: ShieldCheck,
          },
          { name: "Users", href: "/admin/users", icon: Users },
          {
            name: "Theme Preview",
            href: "/admin/theme-preview",
            icon: Palette,
          },
        ]
      : []),

    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const footerItems = menuItems.filter(
    (item) => item.href === "/profile" || item.href === "/settings"
  );

  const navItems = menuItems.filter(
    (item) => item.href !== "/profile" && item.href !== "/settings"
  );

  const publicRoutes = ["/", "/sign-in", "/sign-up"];
  if (publicRoutes.includes(pathname)) return null;

  return (
    <aside
      className={`hidden md:flex fixed top-0 left-0 h-screen
      ${SIDEBAR_THEMES[sidebarTheme].aside}
      border-r flex-col justify-between shadow-xl transition-all duration-300 z-[50]`}
      style={{ width: isOpen ? "16rem" : "5rem" }}
    >
      {/* HEADER */}
      <div className="relative">
        <div className="flex items-center justify-between px-6 py-5 border-b border-inherit">
          <Link href="/dashboard" className="flex items-center gap-3">
            <motion.div animate={{ rotate: isOpen ? 0 : 360 }}>
              <Image
                src="/logo.png"
                alt="Team Home Services"
                width={isOpen ? 34 : 40}
                height={isOpen ? 34 : 40}
                className="rounded-md"
              />
            </motion.div>

            {isOpen && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-lg font-semibold"
              >
                Team Home Services
              </motion.span>
            )}
          </Link>
        </div>

        <button
          onClick={toggleSidebar}
          className={`absolute top-[3.1rem] ${
            isOpen ? "right-[-10px]" : "right-[-12px]"
          } bg-blue-600 text-white rounded-full p-1.5 shadow-md`}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* NAV */}
      <nav className="flex flex-col mt-6 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center justify-between px-6 py-2.5 text-sm transition-all duration-200 ${
                active
                  ? `${SIDEBAR_THEMES[sidebarTheme].active} border-r-4`
                  : SIDEBAR_THEMES[sidebarTheme].hover
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                {isOpen && <span>{item.name}</span>}
              </div>

              {item.hasError && (
                <AlertCircle size={16} className="text-red-500 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="px-4 py-3 border-t border-inherit space-y-2">
        {footerItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-2 py-2 text-sm rounded transition-colors ${
                active
                  ? SIDEBAR_THEMES[sidebarTheme].active
                  : SIDEBAR_THEMES[sidebarTheme].hover
              }`}
            >
              <Icon size={16} />
              {isOpen && <span>{item.name}</span>}
            </Link>
          );
        })}

        <div className="flex justify-center pt-2">
          <span
            className={`text-[10px] font-semibold px-3 py-1 rounded-full ${
              role === "admin"
                ? "bg-blue-600/20 text-blue-400"
                : role === "staff"
                ? "bg-green-600/20 text-green-400"
                : "bg-gray-600/20 text-gray-300"
            }`}
          >
            {role.toUpperCase()}
          </span>
        </div>
      </div>
    </aside>
  );
}
