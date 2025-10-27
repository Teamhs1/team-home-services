"use client";

import { useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

export function useSupabaseWithClerk() {
  const { getToken, isLoaded } = useAuth();

  const getClientWithToken = async () => {
    try {
      if (!isLoaded) {
        console.warn("⚠️ Clerk aún no cargó, usando cliente anónimo.");
        return createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
      }

      const token = await getToken({ template: "supabase" });
      if (!token) {
        console.warn("⚠️ No se obtuvo token Clerk. Cliente anónimo.");
        return createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
      }

      if (process.env.NODE_ENV === "development") {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          console.log("🪶 Clerk JWT payload:", payload);
        } catch {
          console.log("⚠️ No se pudo decodificar JWT");
        }
      }

      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        }
      );
    } catch (err) {
      console.error("❌ Error generando cliente Supabase con Clerk:", err);
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    }
  };

  return { getClientWithToken }; // 👈 ✅ cambia esto
}
