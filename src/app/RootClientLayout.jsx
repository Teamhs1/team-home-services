"use client";
import ScrollToTop from "@/components/ScrollToTop";
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
    <div className="min-h-screen bg-inherit transition-all duration-300">
      <GlobalNavbar />

      <main
        className={`transition-all duration-300 ${
          isDashboard ? "pt-[5rem]" : "pt-[4rem]"
        }`}
      >
        {children}
      </main>

      {/* ✅ AQUÍ */}
      <ScrollToTop />
    </div>
  );
}
