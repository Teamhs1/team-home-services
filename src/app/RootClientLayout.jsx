"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/SidebarContext";
import GlobalNavbar from "@/components/GlobalNavbar";

/**
 * RootClientLayout controla el renderizado del navbar global
 * en TODAS las rutas (públicas y protegidas), sin parpadeos.
 */
export default function RootClientLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isSidebarOpen } = useSidebar?.() || {};

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // 🔹 Detectar rutas protegidas
  const isDashboard =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/jobs") ||
    pathname?.startsWith("/profile");

  return (
    <div className="min-h-screen bg-gray-50 transition-all duration-300">
      {/* ✅ Navbar global (ya maneja su propio marginLeft internamente) */}
      <GlobalNavbar />

      {/* 🔹 Contenido principal */}
      <main
        className={`transition-all duration-300 ${
          isDashboard ? "pt-[5rem]" : "pt-[4rem]"
        }`}
        // ❌ eliminamos marginLeft aquí, lo maneja el navbar
      >
        {children}
      </main>
    </div>
  );
}
