"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSidebar } from "@/components/SidebarContext";

export default function DashboardNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSidebarOpen } = useSidebar?.() || {};

  // Detectar mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Resolver sección actual
  const getSection = () => {
    if (pathname.startsWith("/admin/properties")) return "admin_properties";
    if (pathname.startsWith("/admin/keys")) return "admin_keys"; // ⭐ NUEVO
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/jobs")) return "jobs";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    return null;
  };

  const section = getSection();

  // Tabs por sección
  const subNav = {
    dashboard: [],

    jobs: [
      { label: "All Jobs", href: "/jobs", key: "all" },
      { label: "Completed", href: "/jobs?status=completed", key: "completed" },
      { label: "Pending", href: "/jobs?status=pending", key: "pending" },
      {
        label: "In Progress",
        href: "/jobs?status=in_progress",
        key: "in_progress",
      },
    ],

    settings: [
      { label: "Account", href: "/settings" },
      { label: "Appearance", href: "/settings/appearance" },
      { label: "Notifications", href: "/settings/notifications" },
    ],

    admin: [
      { label: "Users", href: "/admin/users" },
      { label: "Theme Preview", href: "/admin/theme-preview" },
      { label: "Staff Applications", href: "/admin/staff-applications" },
      { label: "Properties", href: "/admin/properties" },
      { label: "Keys", href: "/admin/keys" }, // ⭐ AGREGADO AQUÍ TAMBIÉN (ADMIN GENERAL)
    ],

    // ⭐ Sub menu específico para Properties
    admin_properties: [
      { label: "All Properties", href: "/admin/properties" },
      { label: "Add New", href: "/admin/properties/create" },
    ],

    // ⭐⭐⭐ NUEVO SUBNAV ESPECÍFICO PARA KEYS ⭐⭐⭐
    admin_keys: [
      { label: "All Keys", href: "/admin/keys" },
      { label: "Add New", href: "/admin/keys/create" },
    ],
  };

  const activeTabs = subNav[section] || [];

  // No subnav → no navbar
  if (!activeTabs.length) return null;

  const status = searchParams.get("status");

  // Estilos según sidebar
  const marginLeft = isMobile ? "0" : isSidebarOpen ? "16rem" : "5rem";
  const width = isMobile
    ? "100%"
    : isSidebarOpen
    ? "calc(100% - 16rem)"
    : "calc(100% - 5rem)";

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-[5.3rem] right-0 flex items-center gap-6 
        border-b border-gray-200 bg-white/80 backdrop-blur-md
        px-4 md:px-10 py-3 shadow-sm z-[30] transition-all duration-300"
      style={{ marginLeft, width }}
    >
      {activeTabs.map((tab) => {
        const isActive =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative text-sm font-medium transition-colors ${
              isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-500"
            }`}
          >
            {tab.label}

            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-1 left-0 right-0 h-[2px] bg-blue-600 rounded-full"
              />
            )}
          </Link>
        );
      })}
    </motion.nav>
  );
}
