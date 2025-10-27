"use client";
import { useEffect } from "react";
import { useSupabaseWithClerk } from "@/utils/supabase/useSupabaseWithClerk";

export default function TestSupabaseJWT() {
  const { getClientWithToken } = useSupabaseWithClerk();

  useEffect(() => {
    (async () => {
      const supabase = await getClientWithToken();

      // 🧠 Forzar una llamada autenticada a Supabase
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      console.log("✅ Supabase response:", { data, error });
    })();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center space-y-4">
      <h1 className="text-2xl font-bold">Testing Supabase JWT 🔐</h1>
      <p className="text-gray-600">
        Open the browser console to view the token log.
      </p>
    </div>
  );
}
