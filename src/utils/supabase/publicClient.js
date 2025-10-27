"use client";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente público sin sesión ni token.
 * Solo para canales Broadcast (notificaciones globales).
 */
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
  }
);
