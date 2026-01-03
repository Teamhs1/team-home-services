"use client";

import { useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

/**
 * Hook que devuelve un cliente Supabase autenticado con Clerk.
 * Si Clerk no está cargado todavía, espera hasta obtener el token.
 */
export function useSupabaseWithClerk() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const getClientWithToken = async (retryCount = 0) => {
    try {
      // 🕓 Espera a que Clerk cargue completamente
      if (!isLoaded) {
        console.warn("⏳ Clerk aún no está listo, esperando...");
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (retryCount < 5) return getClientWithToken(retryCount + 1);
      }

      // 🔒 Si el usuario no está logueado, usar cliente anónimo
      if (!isSignedIn) {
        console.warn("⚠️ Usuario no autenticado. Cliente anónimo.");
        return createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
      }

      // 🔑 Obtener token JWT del template "supabase"
      const token = await getToken({ template: "supabase" });
      if (!token) {
        console.warn(
          "⚠️ No se obtuvo token de Clerk. Cliente anónimo temporal."
        );
        return createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
      }

      // 🧠 Log opcional para depurar payload (solo en desarrollo)
      if (process.env.NODE_ENV === "development") {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          console.log("🪪 Clerk JWT payload:", payload);
        } catch {
          console.log("⚠️ No se pudo decodificar JWT");
        }
      }

      // ✅ Crear cliente Supabase autenticado
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
    } catch (err) {
      console.error("❌ Error creando cliente Supabase con Clerk:", err);
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    }
  };

  return { getClientWithToken };
}
