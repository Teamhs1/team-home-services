"use client";
import { useRef } from "react";
import { toast } from "sonner";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  DollarSign,
  Building2,
  KeyRound,
  UsersRound,
  Shield,
  Activity,
  PenTool,
  UserPlus,
  CircleUser,
  Settings,
  Palette,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Mail,
  Factory,
} from "lucide-react";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSidebar } from "@/components/SidebarContext";

/*const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
*/
import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;

async function getSupabase(getToken) {
  if (supabaseClient) return supabaseClient;

  const token = await getToken({ template: "supabase" });
  if (!token) throw new Error("No Clerk token");

  supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );

  return supabaseClient;
}

import { useAuth } from "@clerk/nextjs";

const getSupabaseWithAuth = async (getToken) => {
  const token = await getToken({ template: "supabase" });
  if (!token) throw new Error("No Clerk token");

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );
};
/* =========================
   ICON MAP (SINGLE SOURCE)
========================= */
const ICONS = {
  // Core
  dashboard: LayoutDashboard,
  jobs: Briefcase,
  expenses: DollarSign,
  invoices: Mail,
  properties: Building2,
  keys: KeyRound,
  tenants: UsersRound,
  owners: UsersRound,

  // Admin
  users: Users,
  content: PenTool,
  staffApps: UserPlus,
  syncLogs: Activity,
  companies: Factory, // 👈 distinto a properties
  permissions: Shield,
  features: Settings,

  // System
  profile: CircleUser,
  settings: Settings,
  theme: Palette,
};

/* =========================
   CONSTANTES
========================= */

const ALL_RESOURCES = [
  "jobs",
  "properties",
  "keys",
  "tenants",
  "expenses",
  "invoices",
  "company",
  "owners",
];

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
  const supabaseRef = useRef(null);

  const prevResourcesRef = useRef([]);

  const [role, setRole] = useState("user");
  const [staffType, setStaffType] = useState(null);
  const [hasSyncError, setHasSyncError] = useState(false);
  const [sidebarTheme, setSidebarTheme] = useState("dark");
  const [allowedResources, setAllowedResources] = useState([]);
  const [permissionsReady, setPermissionsReady] = useState(false);
  const fetchPermissionsRef = useRef(null);
  const { getToken } = useAuth();
  const effectiveRole =
    role === "admin" ? "admin" : staffType ? staffType : role;

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

    async function fetchMe() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch /api/me");

        const data = await res.json();

        setRole(data.role || "user");
      } catch (err) {
        console.error("❌ /api/me failed:", err.message);
        setRole("user");
      }
    }

    fetchMe();
  }, [user?.id]);

  /* =========================
   PERMISSIONS (REAL FIX)
   👉 staff_profile_id REAL
========================= */
  useEffect(() => {
    if (!user?.id) return;

    // ✅ ADMIN: permisos inmediatos
    if (role === "admin") {
      setAllowedResources(ALL_RESOURCES);
      setStaffType(null);
      setPermissionsReady(true);
      return;
    }

    async function fetchPermissions() {
      try {
        // 🔑 1. Crear Supabase con Clerk JWT
        const supabase = await getSupabase(getToken);

        // 🔎 2. Obtener el profile real desde Supabase
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, active_company_id")
          .eq("clerk_id", user.id)
          .maybeSingle();

        if (profileError || !profile?.id) {
          setAllowedResources(ALL_RESOURCES);
          setStaffType(null);
          setPermissionsReady(true);
          return;
        }

        /* =========================
         🧩 ROL DE COMPAÑÍA (NUEVO)
      ========================= */
        if (profile.active_company_id) {
          const { data: member } = await supabase
            .from("company_members")
            .select("role")
            .eq("profile_id", profile.id)
            .eq("company_id", profile.active_company_id)
            .single();

          setStaffType(member?.role || null); // 👈 leasing_agent, manager, etc.
        } else {
          setStaffType(null);
        }

        // 🌐 3. Pedir permisos al API (ya validado server-side)
        const res = await fetch(
          `/api/admin/staff-permissions?staff_profile_id=${profile.id}`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          setAllowedResources(ALL_RESOURCES);
          setPermissionsReady(true);
          return;
        }

        const data = await res.json();

        // 🔐 4. Permisos por defecto si no hay nada
        if (!data || data.length === 0) {
          // 👤 CLIENT → acceso completo de compañía
          if (role === "client") {
            setAllowedResources([
              "jobs",
              "properties",
              "keys",
              "tenants",
              "expenses",
              "invoices",
              "company",
            ]);
          }

          // 🧑‍🔧 STAFF con compañía → permisos base
          else if (effectiveRole === "staff") {
            if (staffType === "leasing_manager") {
              setAllowedResources([
                "jobs",
                "properties",
                "keys",
                "tenants",
                "expenses",
                "invoices",
                "company",
                "owners",
              ]);
            } else if (staffType === "leasing_agent") {
              setAllowedResources(["jobs", "properties", "tenants", "company"]);
            } else {
              // staff genérico
              setAllowedResources(["jobs"]);
            }
          }

          // 👻 STAFF sin compañía
          else {
            setAllowedResources(["jobs"]);
          }

          setPermissionsReady(true);
          return;
        }

        // 📦 5. Normalizar permisos

        let newResources = data
          .filter((p) => p.can_view)
          .map((p) => p.resource);

        /*  // 🔐 CLIENT ve company + invoices solo si no está explicitamente negado
        if (role === "client") {
          const explicitlyDenied = data
            .filter((p) => !p.can_view)
            .map((p) => p.resource);

          if (
            !newResources.includes("company") &&
            !explicitlyDenied.includes("company")
          )
            newResources.push("company");

          if (
            !newResources.includes("invoices") &&
            !explicitlyDenied.includes("invoices")
          )
            newResources.push("invoices");
        }*/

        const prevResources = prevResourcesRef.current || [];

        // 🔔 6. Feedback visual
        const added = newResources.filter((r) => !prevResources.includes(r));
        const removed = prevResources.filter((r) => !newResources.includes(r));

        added.forEach((r) => toast.success(`"${r}" added to sidebar`));
        removed.forEach((r) => toast.warning(`"${r}" removed from sidebar`));

        // 💾 7. Guardar estado
        prevResourcesRef.current = newResources;
        setAllowedResources(newResources);
        setPermissionsReady(true);
      } catch (err) {
        console.error("❌ fetchPermissions error:", err);
        setAllowedResources(ALL_RESOURCES);
        setStaffType(null);
        setPermissionsReady(true);
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
      const supabase = await getSupabase(getToken);
      supabaseRef.current = supabase; // ✅ GUARDAR CLIENT

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
            fetchPermissionsRef.current?.();
          },
        )
        .subscribe();
    }

    subscribe();

    return () => {
      if (channel && supabaseRef.current) {
        supabaseRef.current.removeChannel(channel);
      }
    };
  }, [user?.id, role]);
  /* =========================
   REALTIME COMPANY ROLE 🔥
========================= */
  useEffect(() => {
    if (!user?.id || effectiveRole !== "staff") return;

    let channel;

    async function subscribeCompanyRole() {
      const supabase = await getSupabase(getToken);

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, active_company_id")
        .eq("clerk_id", user.id)
        .single();

      if (!profile?.id || !profile.active_company_id) return;

      channel = supabase
        .channel(`company-member-${profile.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "company_members",
            filter: `profile_id=eq.${profile.id}`,
          },
          () => {
            // 🔥 fuerza re-fetch completo
            fetchPermissionsRef.current?.();
          },
        )
        .subscribe();
    }

    subscribeCompanyRole();

    return () => {
      if (channel) {
        channel.unsubscribe();
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
      handlePermissionsUpdated,
    );

    return () => {
      window.removeEventListener(
        "staff-permissions-updated",
        handlePermissionsUpdated,
      );
    };
  }, [user?.id, role]);

  /* =========================
     SYNC ERRORS (ADMIN)
  ========================= */
  useEffect(() => {
    if (role !== "admin") return;

    async function checkRecentSyncErrors() {
      const supabase = await getSupabase(getToken);

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
    if (effectiveRole === "admin") return true;
    return allowedResources.includes(resource);
  }

  /* =========================
     MENU CONFIG
  ========================= */
  const baseItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      href: "/dashboard",
      icon: ICONS.dashboard,
    },
    {
      id: "jobs",
      name: "Jobs",
      href: "/jobs",
      icon: ICONS.jobs,
      resource: "jobs",
    },
    {
      id: "expenses",
      name: "Expenses",
      href: "/expenses",
      icon: ICONS.expenses,
      resource: "expenses",
    },
    {
      id: "invoices",
      name: "Invoices",
      href: "/dashboard/invoices",
      icon: ICONS.invoices,
      resource: "invoices",
    },

    {
      id: "properties-dashboard",
      name: "Properties",
      href: "/dashboard/properties",
      icon: ICONS.properties,
      resource: "properties",
      hideForAdmin: true,
    },
    {
      id: "owners",
      name: "Owners",
      href: "/admin/owners",
      icon: ICONS.owners,
      resource: "owners",
      hideForAdmin: false, // admin SÍ lo ve
    },

    {
      id: "keys-dashboard",
      name: "Keys",
      href: "/dashboard/keys",
      icon: ICONS.keys,
      resource: "keys",
      hideForAdmin: true,
    },
    {
      id: "tenants",
      name: "Tenants",
      href: "/dashboard/tenants",
      icon: ICONS.tenants,
      resource: "tenants",
    },
    {
      id: "company",
      name: "Company",
      href: "/dashboard/company",
      icon: ICONS.companies,
      resource: "company",
      hideForAdmin: true, // 👈🔥
    },
  ];

  const adminItems =
    effectiveRole === "admin"
      ? [
          {
            id: "admin-content",
            name: "Edit Landing Content",
            href: "/admin/content",
            icon: ICONS.content,
          },
          {
            id: "admin-users",
            name: "Users",
            href: "/admin/users",
            icon: ICONS.users,
          },

          {
            id: "admin-staff-apps",
            name: "Staff Applications",
            href: "/admin/staff-applications",
            icon: ICONS.staffApps,
          },
          {
            id: "admin-sync-logs",
            name: "Sync Logs",
            href: "/admin/sync-logs",
            icon: ICONS.syncLogs,
            hasError: hasSyncError,
          },
          {
            id: "admin-properties",
            name: "Properties",
            href: "/admin/properties",
            icon: ICONS.properties,
          },
          {
            id: "admin-companies",
            name: "Companies",
            href: "/admin/companies",
            icon: ICONS.companies,
          },
          {
            id: "admin-keys",
            name: "Keys",
            href: "/admin/keys",
            icon: ICONS.keys,
          },
          {
            id: "admin-permissions",
            name: "Permissions",
            href: "/admin/permissions",
            icon: ICONS.permissions,
          },
          {
            id: "admin-features",
            name: "Features",
            href: "/admin/features",
            icon: ICONS.features,
          },
        ]
      : [];

  const staticItems = [
    {
      id: "profile",
      name: "Profile",
      href: "/profile",
      icon: CircleUser,
    },
    {
      id: "settings",
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
    {
      id: "theme-preview",
      name: "Theme Preview",
      href: "/theme-preview",
      icon: Palette,
      matchPaths: ["/theme-preview", "/admin/theme-preview"],
    },
  ];

  const menuItems = [
    ...baseItems.filter(
      (item) =>
        (!item.resource || hasPermission(item.resource)) &&
        !(role === "admin" && item.hideForAdmin),
    ),
    ...adminItems,
    ...staticItems,
  ];

  const footerItems = menuItems.filter(
    (item) => item.href === "/profile" || item.href === "/settings",
  );

  const navItems = menuItems.filter(
    (item) => item.href !== "/profile" && item.href !== "/settings",
  );
  const mainNavItems = navItems.filter(
    (item) => !item.id?.startsWith("admin-"),
  );

  const adminNavItems = navItems.filter((item) =>
    item.id?.startsWith("admin-"),
  );

  const publicRoutes = ["/", "/sign-in", "/sign-up"];
  if (publicRoutes.includes(pathname)) return null;

  // ⛔️ BLOQUEA RENDER HASTA QUE PERMISOS ESTÉN LISTOS
  if (!permissionsReady) {
    return (
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-[5rem] bg-slate-900 border-r border-slate-800 z-[50]" />
    );
  }

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
          }
  bg-blue-600 text-white rounded-full p-1.5 shadow-md
  transition-colors duration-200
  hover:bg-white hover:text-blue-600`}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* NAV */}
      <nav className="flex flex-col mt-6 flex-1 overflow-y-auto">
        {/* MAIN NAV */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/") ||
              item.matchPaths?.some(
                (p) => pathname === p || pathname.startsWith(p + "/"),
              );

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-all ${
                  active
                    ? `${SIDEBAR_THEMES[sidebarTheme].active} border-r-4`
                    : SIDEBAR_THEMES[sidebarTheme].hover
                }`}
              >
                <Icon size={18} />
                {isOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* ADMIN DIVIDER */}
        {role === "admin" && adminNavItems.length > 0 && (
          <div className="mt-4 mb-2">
            <div className="mx-6 border-t border-slate-700/60" />
            {isOpen && (
              <span className="block px-6 mt-3 text-[11px] uppercase tracking-wider text-slate-400">
                Admin Tools
              </span>
            )}
          </div>
        )}

        {/* ADMIN NAV */}
        <div className="space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.id}
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
        </div>
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

        <div className="flex flex-col items-center pt-2 gap-1">
          {/* ROLE BADGE */}
          <span
            className={`text-[10px] font-semibold px-3 py-1 rounded-full ${
              role === "admin"
                ? "bg-blue-600/20 text-blue-400"
                : role === "staff"
                  ? "bg-green-600/20 text-green-400"
                  : "bg-gray-600/20 text-gray-300"
            }`}
          >
            {effectiveRole.toUpperCase()}
          </span>

          {/* STAFF SUBROLE BADGE */}
          {effectiveRole === "staff" && staffType && (
            <span className="text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">
              {staffType.replace(/_/g, " ")}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
