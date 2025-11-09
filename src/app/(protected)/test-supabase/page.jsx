"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";

export default function TestSupabaseButton() {
  const [result, setResult] = useState(null);
  const [ready, setReady] = useState(false);
  const { getToken, isLoaded } = useAuth();

  // ✅ Asegurar que Clerk esté cargado
  useEffect(() => {
    if (isLoaded) setReady(true);
  }, [isLoaded]);

  const handleClick = async () => {
    try {
      if (!ready) {
        setResult({ error: "Clerk todavía no está listo" });
        return;
      }

      // 🟢 Obtener el token directamente desde useAuth()
      const token = await getToken({ template: "supabase" });

      if (!token) {
        setResult({
          error:
            "❌ No se pudo obtener token de Clerk (getToken devolvió null)",
        });
        return;
      }

      // 🟢 Llamar al endpoint con Authorization Bearer token
      const res = await fetch("/api/test-supabase", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error:", err);
      setResult({ error: err.message });
    }
  };

  return (
    <div className="p-4 border rounded-md w-fit space-y-2 bg-white shadow-sm">
      <Button onClick={handleClick}>Test /api/test-supabase</Button>
      {result && (
        <pre className="mt-2 bg-black text-white text-xs p-2 rounded w-[320px] overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
