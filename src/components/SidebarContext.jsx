"use client";

import { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext();

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(null); // 👈 null evita render SSR hasta hidratar
  const [hydrated, setHydrated] = useState(false);

  // ✅ Inicializar estado una vez en cliente
  useEffect(() => {
    setHydrated(true);

    const saved = localStorage.getItem("sidebar_state");
    if (saved) {
      setIsSidebarOpen(saved === "open");
    } else {
      // detecta tamaño inicial de pantalla
      setIsSidebarOpen(window.innerWidth >= 768);
    }

    const handleResize = () => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Guardar preferencia en localStorage
  useEffect(() => {
    if (isSidebarOpen === null) return;
    localStorage.setItem("sidebar_state", isSidebarOpen ? "open" : "collapsed");
  }, [isSidebarOpen]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // 🚫 Evitar render SSR hasta hidratar (previene hydration mismatch)
  if (!hydrated || isSidebarOpen === null) {
    return null;
  }

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}
