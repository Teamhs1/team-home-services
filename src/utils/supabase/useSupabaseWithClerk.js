"use client";

import { useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

/**
 * Hook Supabase + Clerk (JWT SAFE)
 * ✅ Token siempre fresco
 * ✅ Sin JWT expired
 * ❌ No singleton con token
 */
export function useSupabaseWithClerk() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const getClientWithToken = async (retryCount = 0) => {
    // ⏳ Esperar a Clerk
    if (!isLoaded) {
      if (retryCount >= 5) {
        throw new Error("Clerk did not load in time");
      }
      await new Promise((r) => setTimeout(r, 300));
      return getClientWithToken(retryCount + 1);
    }

    if (!isSignedIn) {
      throw new Error("User is not signed in");
    }

    // 🔑 TOKEN FRESCO SIEMPRE
    const token = await getToken({ template: "supabase" });
    if (!token) {
      throw new Error("No Clerk JWT available");
    }

    // 🧪 Debug opcional
    if (process.env.NODE_ENV === "development") {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("✅ Clerk JWT sub:", payload.sub);
      } catch {
        console.warn("⚠️ Could not decode Clerk JWT");
      }
    }

    // ✅ CREAR CLIENTE CON TOKEN ACTUAL
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
  };

  return { getClientWithToken };
}
