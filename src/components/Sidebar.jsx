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
  Key, // ✅ IMPORTADO
} from "lucide-react";

import { useState, useEffect } from "react";
import { UserButton, useUser, useClerk } from "@clerk/nextjs";
import { useSidebar } from "@/components/SidebarContext";
import { createClient } from "@supabase/supabase-js";
import ClientOnly from "@/components/ClientOnly"; // ✅ nuevo wrapper

// 🔹 Crear cliente Supabase global
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen: isOpen, toggleSidebar } = useSidebar();
  const { user, isLoaded } = useUser();
  const { session } = useClerk();

  const [role, setRole] = useState("user");
  const [hasSyncError, setHasSyncError] = useState(false);

  // 🔹 Refrescar rol desde Clerk
  useEffect(() => {
    if (isLoaded && user) {
      const freshRole = user.publicMetadata?.role || "user";
      setRole(freshRole);
    }
  }, [isLoaded, user]);

  // 🔁 Verificar rol en Supabase cada 5s
  useEffect(() => {
    async function checkRoleFromSupabase() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("clerk_id", user.id)
          .single();

        if (!error && data?.role && data.role !== role) {
          setRole(data.role);
        }
      } catch (err) {
        console.error("⚠️ Error verificando rol desde Supabase:", err.message);
      }
    }

    const interval = setInterval(checkRoleFromSupabase, 5000);
    return () => clearInterval(interval);
  }, [user, role]);

  // 🔍 Verificar errores recientes de sync (solo admin)
  useEffect(() => {
    if (role !== "admin") return;

    async function checkRecentSyncErrors() {
      const since = new Date();
      since.setDate(since.getDate() - 1);

      const { data, error } = await supabase
        .from("sync_logs")
        .select("id")
        .eq("status", "error")
        .gte("created_at", since.toISOString())
        .limit(1);

      if (!error && data?.length > 0) setHasSyncError(true);
      else setHasSyncError(false);
    }

    checkRecentSyncErrors();
    const interval = setInterval(checkRecentSyncErrors, 30000);
    return () => clearInterval(interval);
  }, [role]);

  // 🔹 Definir menú
  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Jobs", href: "/jobs", icon: ClipboardList },

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
        ]
      : []),

    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // ⭐ Agregar Keys dentro del bloque admin SIN romper nada
  if (role === "admin") {
    menuItems.push(
      { name: "Properties", href: "/admin/properties", icon: ClipboardList }, // 🆕 AÑADIDO
      { name: "Keys", href: "/admin/keys", icon: Key },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Theme Preview", href: "/admin/theme-preview", icon: Palette }
    );
  }

  // 🚫 Ocultar sidebar en páginas públicas
  const publicRoutes = ["/", "/sign-in", "/sign-up"];
  if (publicRoutes.includes(pathname)) return null;

  return (
    <aside
      className={`hidden md:flex fixed top-0 left-0 h-screen bg-white border-r border-gray-200
        flex-col justify-between shadow-sm transform transition-all duration-300 z-[50]`}
      style={{ width: isOpen ? "16rem" : "5rem" }}
    >
      {/* 🔹 Header con logo */}
      <div className="relative">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-3">
            <motion.div
              initial={false}
              animate={{ rotate: isOpen ? 0 : 360 }}
              transition={{ duration: 0.4 }}
            >
              <Image
                src="/logo.png"
                alt="Team Home Services"
                width={isOpen ? 34 : 40}
                height={isOpen ? 34 : 40}
                className="rounded-md transition-all duration-300"
              />
            </motion.div>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="text-lg font-semibold text-gray-800 whitespace-nowrap"
              >
                Team Home Services
              </motion.span>
            )}
          </Link>
        </div>

        {/* 🔹 Botón colapsar */}
        <button
          onClick={toggleSidebar}
          className={`absolute top-[3.1rem]
${isOpen ? "right-[-10px]" : "right-[-12px]"}
bg-blue-600 border border-blue-700
text-white
rounded-full p-1.5 shadow-md hover:bg-blue-700
transition-all duration-300 z-[10050]`}
          aria-label="Toggle sidebar"
        >
          {isOpen ? (
            <ChevronLeft size={16} className="text-white" />
          ) : (
            <ChevronRight size={16} className="text-white" />
          )}
        </button>
      </div>

      {/* 🔸 Navegación */}
      <nav className="flex flex-col mt-6 space-y-1 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center justify-between px-6 py-2.5 text-sm font-medium transition-all
                ${
                  active
                    ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                {isOpen && <span>{item.name}</span>}
              </div>

              {item.hasError && (
                <AlertCircle
                  size={16}
                  className="text-red-500 animate-pulse ml-2"
                  title="Recent sync error"
                />
              )}

              {!isOpen && (
                <span
                  className="
      fixed
      left-[72px]
      top-auto
      py-1 px-2
      whitespace-nowrap
      bg-gray-900 text-white text-xs rounded-md shadow-lg
      opacity-0 group-hover:opacity-100
      pointer-events-none
      transition-opacity duration-150
      z-[99999]
    "
                >
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 🔻 Footer — SOLO mostrar el rol */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center">
        <span
          className={`text-[10px] font-semibold px-3 py-1 rounded-full ${
            role === "admin"
              ? "bg-blue-100 text-blue-700"
              : role === "staff"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {role.toUpperCase()}
        </span>
      </div>
    </aside>
  );
}
