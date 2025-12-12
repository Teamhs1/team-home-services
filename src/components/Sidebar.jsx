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
  Building, // correcto
} from "lucide-react";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useSidebar } from "@/components/SidebarContext";
import { createClient } from "@supabase/supabase-js";

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

  if (role === "admin") {
    menuItems.push(
      { name: "Properties", href: "/admin/properties", icon: ClipboardList },
      { name: "Companies", href: "/admin/companies", icon: Building },
      { name: "Keys", href: "/admin/keys", icon: Key },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Theme Preview", href: "/admin/theme-preview", icon: Palette }
    );
  }

  const publicRoutes = ["/", "/sign-in", "/sign-up"];
  if (publicRoutes.includes(pathname)) return null;

  return (
    <aside
      className={`hidden md:flex fixed top-0 left-0 h-screen bg-white border-r border-gray-200
      flex-col justify-between shadow-sm transition-all duration-300 z-[50]`}
      style={{ width: isOpen ? "16rem" : "5rem" }}
    >
      {/* HEADER */}
      <div className="relative">
        <div className="flex items-center justify-between px-6 py-5 border-b">
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
                className="text-lg font-semibold text-gray-800"
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
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center justify-between px-6 py-2.5 text-sm transition-all ${
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
                <AlertCircle size={16} className="text-red-500 animate-pulse" />
              )}

              {/* ⭐ Tooltip cuando está cerrado */}
              {!isOpen && (
                <span
                  className="
                    fixed left-[72px]
                    bg-gray-900 text-white text-xs py-1 px-2
                    rounded-md shadow-lg
                    whitespace-nowrap
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-150
                    pointer-events-none
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

      {/* FOOTER */}
      <div className="px-6 py-4 border-t flex items-center justify-center">
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
