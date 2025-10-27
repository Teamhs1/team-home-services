"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function ApiTest() {
  const { getToken, isSignedIn } = useAuth();
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function testProxy() {
      if (!isSignedIn) {
        setResult("⚠️ No estás logueado en Clerk");
        return;
      }

      const clerkToken = await getToken({ template: "supabase" }); // 👈 cambio importante
      console.log("🪪 Clerk token (RS256):", clerkToken?.slice(0, 40) + "...");

      const res = await fetch("/api/supabase-proxy-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: clerkToken }),
      });

      const data = await res.json();
      console.log("🔄 Respuesta del proxy:", data);
      setResult(JSON.stringify(data, null, 2));
    }

    testProxy();
  }, [isSignedIn]);

  return (
    <div style={{ padding: 30 }}>
      <h1>🔍 Prueba del Proxy Supabase</h1>
      <pre
        style={{
          background: "#f5f5f5",
          padding: "15px",
          borderRadius: "8px",
          marginTop: "20px",
          maxWidth: "90%",
          overflowX: "auto",
        }}
      >
        {result || "Esperando respuesta..."}
      </pre>
    </div>
  );
}
