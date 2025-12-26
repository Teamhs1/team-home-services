"use client";

import { usePathname, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSidebar } from "@/components/SidebarContext";
import { useState, useEffect } from "react";

export default function DashboardNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const profileId = params?.id;

  const { isSidebarOpen } = useSidebar?.() || {};

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const status = searchParams.get("status");

  /* =========================
     🔹 THEME (SIN ROMPER)
  ========================= */
  const [sidebarTheme, setSidebarTheme] = useState("light");

  useEffect(() => {
    const syncTheme = () => {
      const stored = localStorage.getItem("sidebarTheme") || "light";
      setSidebarTheme(stored);
    };

    syncTheme();
    const interval = setInterval(syncTheme, 400);
    return () => clearInterval(interval);
  }, []);

  /* =========================
     RESOLVER SECCIÓN
  ========================= */
  const getSection = () => {
    if (pathname === "/admin/companies") return null;
    if (pathname.startsWith("/admin/companies/")) return "admin_company";
    if (pathname.startsWith("/admin/profiles/")) return "admin_profile";
    if (pathname.startsWith("/admin/properties")) return "admin_properties";
    if (pathname.startsWith("/admin/keys")) return "admin_keys";
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/jobs")) return "jobs";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    return null;
  };

  const section = getSection();

  const companyBase = pathname.startsWith("/admin/companies/")
    ? pathname.split("/").slice(0, 4).join("/")
    : null;

  /* =========================
     SUB NAV CONFIG
  ========================= */
  const subNav = {
    dashboard: [],

    jobs: [
      { label: "All Jobs", href: "/jobs", status: null },
      {
        label: "Completed",
        href: "/jobs?status=completed",
        status: "completed",
      },
      { label: "Pending", href: "/jobs?status=pending", status: "pending" },
      {
        label: "In Progress",
        href: "/jobs?status=in_progress",
        status: "in_progress",
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
      { label: "Keys", href: "/admin/keys" },
    ],

    admin_properties: [
      { label: "All Properties", href: "/admin/properties" },
      { label: "Add New", href: "/admin/properties/create" },
    ],

    admin_keys: [
      { label: "All Keys", href: "/admin/keys" },
      { label: "Reported Issues", href: "/admin/keys/reported" },
      { label: "Add New", href: "/admin/keys/create" },
    ],

    admin_company: companyBase
      ? [
          { label: "Overview", href: companyBase },
          { label: "Members", href: `${companyBase}/members` },
          { label: "Settings", href: `${companyBase}/edit` },
        ]
      : [],

    /* 🔹 PERFIL ADMIN (NUEVO – SIN ROMPER NADA) */
    admin_profile: profileId
      ? [
          {
            label: "Profile",
            href: `/admin/profiles/${profileId}`,
          },
          {
            label: "Permissions",
            href: `/admin/profiles/${profileId}/permissions`,
          },
        ]
      : [],
  };

  const activeTabs = subNav[section] || [];
  if (!activeTabs.length) return null;

  /* =========================
     LAYOUT
  ========================= */
  const marginLeft = isMobile ? "0" : isSidebarOpen ? "16rem" : "5rem";
  const width = isMobile
    ? "100%"
    : isSidebarOpen
    ? "calc(100% - 16rem)"
    : "calc(100% - 5rem)";

  /* =========================
     RENDER
  ========================= */
  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`
        fixed top-[5.3rem] right-0 z-[30]
        flex items-center gap-6
        backdrop-blur-md
        px-4 md:px-10 py-3
        shadow-sm
        transition-colors duration-300
        ${
          sidebarTheme === "dark"
            ? "bg-slate-900/80 border-b border-slate-800 text-slate-200"
            : "bg-white/80 border-b border-gray-200 text-gray-700"
        }
      `}
      style={{ marginLeft, width }}
    >
      {activeTabs.map((tab) => {
        let isActive = false;

        if (section === "jobs") {
          isActive =
            pathname === "/jobs" &&
            (tab.status === status || (tab.status === null && status === null));
        } else {
          isActive =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative text-sm font-medium transition-colors ${
              isActive
                ? sidebarTheme === "dark"
                  ? "text-blue-400"
                  : "text-blue-600"
                : sidebarTheme === "dark"
                ? "text-slate-400 hover:text-white"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            {tab.label}

            {isActive && (
              <motion.div
                layoutId="activeTab"
                className={`absolute -bottom-1 left-0 right-0 h-[2px] rounded-full ${
                  sidebarTheme === "dark" ? "bg-blue-400" : "bg-blue-600"
                }`}
              />
            )}
          </Link>
        );
      })}
    </motion.nav>
  );
}
