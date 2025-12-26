"use client";
import { useRef } from "react";
import { toast } from "sonner";

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
import { useUser } from "@clerk/nextjs";
import { useSidebar } from "@/components/SidebarContext";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* =========================
   CONSTANTES
========================= */

const ALL_RESOURCES = ["jobs", "properties", "keys", "tenants"];

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
  const { user } = useUser();
  const NO_CACHE = { cache: "no-store" };
  const prevResourcesRef = useRef([]);

  const [role, setRole] = useState("user");
  const [hasSyncError, setHasSyncError] = useState(false);
  const [sidebarTheme, setSidebarTheme] = useState("dark");
  const [allowedResources, setAllowedResources] = useState([]);
  const fetchPermissionsRef = useRef(null);

  /* =========================
     THEME
  ========================= */
  useEffect(() => {
    const syncTheme = () => {
      const stored = localStorage.getItem("sidebarTheme") || "dark";
      setSidebarTheme(stored);
    };

    syncTheme();
    const interval = setInterval(syncTheme, 400);
    return () => clearInterval(interval);
  }, []);

  /* =========================
     ROLE
  ========================= */
  useEffect(() => {
    if (!user?.id) return;

    async function fetchRole() {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("clerk_id", user.id)
        .single();

      if (!error) {
        setRole(data?.role || "user");
      }
    }

    fetchRole();
  }, [user?.id]);

  /* =========================
   PERMISSIONS (REAL FIX)
   👉 staff_profile_id REAL
========================= */
  useEffect(() => {
    if (!user?.id || role === "admin") {
      setAllowedResources(ALL_RESOURCES);
      return;
    }

    async function fetchPermissions() {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("clerk_id", user.id)
          .single();

        if (profileError || !profile?.id) {
          setAllowedResources(ALL_RESOURCES);
          return;
        }

        const res = await fetch(
          `/api/admin/staff-permissions?staff_profile_id=${profile.id}`,
          { cache: "no-store" } // 🔥 CLAVE
        );

        if (!res.ok) {
          setAllowedResources(ALL_RESOURCES);
          return;
        }

        const data = await res.json();

        if (!data || data.length === 0) {
          setAllowedResources(ALL_RESOURCES);
          return;
        }

        const newResources = data.map((p) => p.resource);
        const prevResources = prevResourcesRef.current || [];

        // Detectar cambios
        const added = newResources.filter((r) => !prevResources.includes(r));
        const removed = prevResources.filter((r) => !newResources.includes(r));

        // Mostrar feedback
        added.forEach((r) => {
          toast.success(`"${r}" added to sidebar`);
        });

        removed.forEach((r) => {
          toast.warning(`"${r}" removed from sidebar`);
        });

        // Guardar estado
        prevResourcesRef.current = newResources;
        setAllowedResources(newResources);
      } catch (err) {
        console.error(err);
        setAllowedResources(ALL_RESOURCES);
      }
    }

    // 🔑 GUARDAR en el ref
    fetchPermissionsRef.current = fetchPermissions;

    // 🔑 Ejecutar normal
    fetchPermissions();
  }, [user?.id, role]);
  /* =========================
   REALTIME STAFF PERMISSIONS
========================= */
  useEffect(() => {
    if (!user?.id || role === "admin") return;

    let channel;

    async function subscribe() {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

      if (!profile?.id) return;

      channel = supabase
        .channel(`staff-permissions-${profile.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "staff_permissions",
            filter: `staff_profile_id=eq.${profile.id}`,
          },
          () => {
            // 🔥 permisos cambiaron → re-fetch
            fetchPermissionsRef.current?.();
          }
        )
        .subscribe();
    }

    subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, role]);

  /* =========================
   PERMISSIONS LIVE UPDATE
========================= */
  useEffect(() => {
    function handlePermissionsUpdated() {
      // fuerza re-fetch de permisos
      if (user?.id && role !== "admin") {
        fetchPermissionsRef.current?.();
      }
    }

    window.addEventListener(
      "staff-permissions-updated",
      handlePermissionsUpdated
    );

    return () => {
      window.removeEventListener(
        "staff-permissions-updated",
        handlePermissionsUpdated
      );
    };
  }, [user?.id, role]);
  /* =========================
   PERMISSIONS SAFETY REFRESH
   (BACKUP REALTIME)
========================= */
  useEffect(() => {
    if (!user?.id || role === "admin") return;

    const interval = setInterval(() => {
      fetchPermissionsRef.current?.();
    }, 4000); // cada 4 segundos (seguro)

    return () => clearInterval(interval);
  }, [user?.id, role]);

  /* =========================
     SYNC ERRORS (ADMIN)
  ========================= */
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

  /* =========================
     HELPERS
  ========================= */
  function hasPermission(resource) {
    if (role === "admin") return true;
    return allowedResources.includes(resource);
  }

  /* =========================
     MENU CONFIG
  ========================= */
  const baseItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Jobs", href: "/jobs", icon: ClipboardList, resource: "jobs" },
    {
      name: "Properties",
      href: "/dashboard/properties",
      icon: Building,
      resource: "properties",
    },
    { name: "Keys", href: "/dashboard/keys", icon: Key, resource: "keys" },
    {
      name: "Tenants",
      href: "/dashboard/tenants",
      icon: Users,
      resource: "tenants",
    },
  ];

  const adminItems =
    role === "admin"
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
      : [];

  const staticItems = [
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const menuItems = [
    ...baseItems.filter(
      (item) => !item.resource || hasPermission(item.resource)
    ),
    ...adminItems,
    ...staticItems,
  ];

  const footerItems = menuItems.filter(
    (item) => item.href === "/profile" || item.href === "/settings"
  );

  const navItems = menuItems.filter(
    (item) => item.href !== "/profile" && item.href !== "/settings"
  );

  const publicRoutes = ["/", "/sign-in", "/sign-up"];
  if (publicRoutes.includes(pathname)) return null;

  /* =========================
     RENDER
  ========================= */
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
              className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-all ${
                active
                  ? `${SIDEBAR_THEMES[sidebarTheme].active} border-r-4`
                  : SIDEBAR_THEMES[sidebarTheme].hover
              }`}
            >
              <Icon size={18} />
              {isOpen && <span>{item.name}</span>}
              {item.hasError && (
                <AlertCircle
                  size={16}
                  className="text-red-500 animate-pulse ml-auto"
                />
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
              className={`flex items-center gap-3 px-2 py-2 text-sm rounded ${
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
