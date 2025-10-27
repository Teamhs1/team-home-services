"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSidebar } from "@/components/SidebarContext";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  User,
  Settings,
  Palette,
  FileEdit,
  FileSpreadsheet,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DashboardNavbar() {
  const pathname = usePathname();
  const { isSidebarOpen } = useSidebar?.() || {};
  const { user, isLoaded } = useUser();

  const [pendingCount, setPendingCount] = useState(0);
  const role = isLoaded ? user?.publicMetadata?.role || "user" : "user";

  // Mostrar solo dentro del dashboard protegido
  const isInDashboard =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/jobs") ||
    pathname?.startsWith("/staff") ||
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/settings") ||
    pathname?.startsWith("/admin");

  if (!isInDashboard) return null;

  // 🧩 Cargar cantidad de solicitudes pendientes
  async function fetchPendingApplications() {
    if (role !== "admin") return;
    const { count, error } = await supabase
      .from("staff_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"); // 🔹 Asume que tienes un campo 'status'
    if (!error && typeof count === "number") setPendingCount(count);
  }

  // 🧩 Cargar al iniciar y suscribirse a cambios
  useEffect(() => {
    if (role !== "admin") return;

    fetchPendingApplications();

    const channel = supabase
      .channel("staff_applications_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff_applications" },
        () => fetchPendingApplications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role]);

  // 🔗 Enlaces base (usuarios normales)
  const baseLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", label: "Jobs", icon: ClipboardList },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  // 🔗 Enlaces extra (solo admin)
  const adminLinks = [
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/theme-preview", label: "Theme Preview", icon: Palette },
    { href: "/admin/content", label: "Edit Landing", icon: FileEdit },
    {
      href: "/admin/staff-applications",
      label: "Staff Applications",
      icon: FileSpreadsheet,
      badge: pendingCount, // 🔹 Añadido badge dinámico
    },
  ];

  const combinedLinks =
    role === "admin"
      ? [...baseLinks, ...adminLinks].filter(
          (v, i, a) => a.findIndex((t) => t.href === v.href) === i
        )
      : baseLinks;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-[4.5rem] right-0 flex items-center gap-6 
                 border-b border-gray-200 bg-white/80 backdrop-blur-md
                 px-6 md:px-10 py-2 shadow-sm z-[60] transition-all duration-300"
      style={{
        left: isSidebarOpen ? "16rem" : "5rem",
      }}
    >
      {combinedLinks.map((link) => {
        const Icon = link.icon;
        const isActive =
          pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${
              isActive
                ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            <Icon size={16} />
            <span>{link.label}</span>

            {/* 🔴 Badge dinámico */}
            {link.badge > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {link.badge}
              </span>
            )}
          </Link>
        );
      })}
    </motion.nav>
  );
}
