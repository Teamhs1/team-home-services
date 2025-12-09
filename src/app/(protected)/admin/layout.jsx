"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      {/* Sidebar izquierdo del admin */}
      <aside className="hidden md:flex h-screen sticky top-0">
        <Sidebar />
      </aside>

      {/* Contenido principal del admin */}
      <div className="flex-1 w-full min-h-screen px-4 sm:px-8 py-6">
        {children}
      </div>
    </div>
  );
}
