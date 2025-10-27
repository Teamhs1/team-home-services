"use client";

import { useSidebar } from "@/components/SidebarContext";

export default function ProtectedLayoutClient({ children }) {
  const { isSidebarOpen } = useSidebar?.() || {};
  const marginLeft = isSidebarOpen ? "16rem" : "5rem";

  return (
    <div
      className="flex flex-col flex-1 transition-all duration-300"
      style={{ marginLeft }}
    >
      {children}
    </div>
  );
}
