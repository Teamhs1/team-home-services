"use client";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase global, sin sesión persistente.
 * Usado para operaciones públicas, Realtime y Broadcast (funciona junto con Clerk).
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false, // evita conflictos con Clerk
      autoRefreshToken: false, // no se renuevan tokens públicos
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // mejora el rendimiento de canales broadcast
      },
    },
  }
);
