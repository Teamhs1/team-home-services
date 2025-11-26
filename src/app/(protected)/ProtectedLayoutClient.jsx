"use client";

import { useSidebar } from "@/components/SidebarContext";

export default function ProtectedLayoutClient({ children }) {
  const { isSidebarOpen } = useSidebar?.() || {};

  // 📌 Solo aplicar margen en pantallas grandes
  const marginLeft =
    typeof window !== "undefined" && window.innerWidth >= 768
      ? isSidebarOpen
        ? "16rem"
        : "5rem"
      : "0"; // 🔥 En móvil, SIEMPRE 0

  return (
    <div
      className="flex flex-col flex-1 transition-all duration-300"
      style={{ marginLeft }}
    >
      {children}
    </div>
  );
}
