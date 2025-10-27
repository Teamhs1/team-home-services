"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

/**
 * 🧩 SafeClerkWrapper
 *
 * Un contenedor confiable para asegurar que Clerk esté completamente cargado
 * antes de acceder a `user`, `getToken` o `publicMetadata`.
 *
 * Uso:
 * <SafeClerkWrapper>
 *   {({ user, clerkId, role, getToken }) => (
 *     <Dashboard user={user} role={role} />
 *   )}
 * </SafeClerkWrapper>
 */
export default function SafeClerkWrapper({ children, onReady }) {
  const { isLoaded: userLoaded, user } = useUser();
  const { isLoaded: authLoaded, getToken } = useAuth();

  const ready = userLoaded && authLoaded;
  const clerkId = user?.id || null;
  const role = user?.publicMetadata?.role || "client";

  // 🚀 Ejecuta callback opcional cuando Clerk está listo
  useEffect(() => {
    if (ready && onReady) {
      onReady({ user, clerkId, role, getToken });
    }
  }, [ready]);

  // 🌀 Loading UI mientras Clerk se inicializa
  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-600">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500 mb-3" />
        <p className="text-sm">Loading session...</p>
      </div>
    );
  }

  // ✅ Renderiza hijos cuando Clerk está completamente cargado
  return <>{children({ user, clerkId, role, getToken })}</>;
}
