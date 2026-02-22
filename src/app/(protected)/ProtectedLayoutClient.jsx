"use client";

import { useSidebar } from "@/components/SidebarContext";

export default function ProtectedLayoutClient({ children }) {
  const { isSidebarOpen } = useSidebar?.() || {};

  return (
    <div
      className={`flex flex-col flex-1 transition-all duration-300
      ${isSidebarOpen ? "md:ml-64" : "md:ml-20"} ml-0`}
    >
      {children}
    </div>
  );
}
