"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

export function useClients() {
  const [clientList, setClientList] = useState([]);

  async function fetchClients() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from("profiles")
      .select("id, clerk_id, full_name, email, role")
      .eq("role", "client")
      .order("full_name", { ascending: true });

    if (!error) setClientList(data || []);
  }

  return { clientList, fetchClients };
}
