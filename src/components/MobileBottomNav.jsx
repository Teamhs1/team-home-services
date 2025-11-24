"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  ClipboardList,
  PlusCircle,
  Mail,
  User,
  Settings,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  if (!isLoaded) return null;

  const role = user?.publicMetadata?.role || "client";

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  if (!isMobile) return null;

  // ❌ No mostrar en login/registro
  const hiddenRoutes = ["/sign-in", "/sign-up"];
  if (hiddenRoutes.includes(pathname)) return null;

  // ⭐ Navegación basada en ROL
  let navItems = [];

  // ============================
  // ⭐ ADMIN
  // ============================
  if (role === "admin") {
    navItems = [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Jobs", icon: ClipboardList, href: "/jobs" },
      {
        label: "Add",
        icon: PlusCircle,
        href: "/jobs/new",
        center: true,
      },
      { label: "Inbox", icon: Mail, href: "/admin/messages" },
      { label: "Users", icon: Users, href: "/admin/users" },
    ];
  }

  // ============================
  // ⭐ STAFF
  // ============================
  if (role === "staff") {
    navItems = [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Jobs", icon: ClipboardList, href: "/jobs" },
      {
        label: "Start",
        icon: PlusCircle,
        href: "/jobs?status=pending",
        center: true,
      },
      { label: "Inbox", icon: Mail, href: "/messages" },
      { label: "Profile", icon: User, href: "/profile" },
    ];
  }

  // ============================
  // ⭐ CLIENT
  // ============================
  if (role === "client") {
    navItems = [
      { label: "Home", icon: Home, href: "/" },
      { label: "My Jobs", icon: ClipboardList, href: "/jobs" },
      {
        label: "Request",
        icon: PlusCircle,
        href: "/jobs/create",
        center: true,
      },
      { label: "Inbox", icon: Mail, href: "/messages" },
      { label: "Profile", icon: User, href: "/profile" },
    ];
  }

  return (
    <div className="fixed bottom-0 left-0 w-full h-20 bg-white border-t border-gray-200 shadow-lg z-[9999] flex items-center justify-between px-6">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        // ⭐ Botón central elevado
        if (item.center) {
          return (
            <button
              key={index}
              onClick={() => router.push(item.href)}
              className="relative -mt-6 flex flex-col items-center justify-center"
            >
              <div className="bg-blue-600 p-4 rounded-full shadow-2xl">
                <Icon size={28} className="text-white" />
              </div>
              <span className="text-xs text-gray-700 mt-1 font-medium">
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={index}
            onClick={() => router.push(item.href)}
            className="flex flex-col items-center justify-center text-center"
          >
            <Icon
              size={24}
              className={isActive ? "text-blue-600" : "text-gray-600"}
            />
            <span
              className={`text-xs mt-1 ${
                isActive ? "text-blue-600 font-semibold" : "text-gray-700"
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
