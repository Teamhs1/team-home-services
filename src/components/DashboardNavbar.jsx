"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSidebar } from "@/components/SidebarContext";

export default function DashboardNavbar() {
  const pathname = usePathname();
  const { isSidebarOpen } = useSidebar?.() || {};

  // 🧭 Detectar sección principal
  const getSection = () => {
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/jobs")) return "jobs";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    return null;
  };

  const section = getSection();

  // 🧩 Submenús contextuales
  const subNav = {
    dashboard: [],
    jobs: [
      { label: "All Jobs", href: "/jobs" },
      { label: "Completed", href: "/jobs/completed" },
      { label: "Pending", href: "/jobs/pending" },
      { label: "In Progress", href: "/jobs/in-progress" },
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
    ],
  };

  const activeTabs = subNav[section] || [];

  // 🚫 Ocultar si no hay subnavegación
  if (!activeTabs.length) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-[4.5rem] right-0 flex items-center gap-6 
           border-b border-gray-200 bg-white/80 backdrop-blur-md
           px-6 md:px-10 py-3 shadow-sm z-[30] transition-all duration-300"
      style={{
        left: isSidebarOpen ? "16rem" : "5rem",
      }}
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
