"use client";

import { useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

export function useStaff() {
  const { getToken } = useAuth(); // ✅ SIEMPRE disponible
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);

      const token = await getToken({ template: "supabase" });

      if (!token) {
        throw new Error("Missing Supabase auth token");
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          auth: { persistSession: false },
        },
      );

      const { data, error } = await supabase
        .from("profiles")
        .select("id, clerk_id, full_name, role")
        .eq("role", "staff")
        .order("full_name", { ascending: true })
        .limit(50);

      if (error) throw error;

      setStaffList(data || []);
    } catch (err) {
      console.error("❌ Error fetching staff:", err.message);
      toast.error("Error fetching staff: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  return { staffList, loading, fetchStaff };
}
