"use client";
import { useState, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

export function useStaff(getToken) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Cliente de Supabase estable y aislado
  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      ),
    []
  );

  // ✅ Función principal con manejo de errores
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken?.({ template: "supabase" });

      const { data, error } = await supabase
        .from("profiles")
        .select("id, clerk_id, full_name, role")
        .eq("role", "staff")
        .order("full_name", { ascending: true });

      if (error) throw error;

      setStaffList(data || []);
    } catch (err) {
      console.error("❌ Error fetching staff:", err.message);
      toast.error("Error fetching staff: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase, getToken]);

  return { staffList, loading, fetchStaff };
}
