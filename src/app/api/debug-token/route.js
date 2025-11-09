import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // ✅ 1. Obtener el token de Clerk correctamente
    const { sessionClaims, getToken } = await auth();
    const token = await getToken({ template: "supabase" });

    if (!token) {
      return NextResponse.json(
        { error: "No token found from Clerk. User may not be signed in." },
        { status: 401 }
      );
    }

    // ✅ 2. Decodificar el JWT
    const base64Payload = token.split(".")[1];
    const decodedPayload = JSON.parse(atob(base64Payload));

    // ✅ 3. Detectar automáticamente el claim key
    const claimKey = Object.keys(decodedPayload).find((k) =>
      k.includes("/jwt/claims")
    );
    const claimData = decodedPayload[claimKey] || {};

    // ✅ 4. Crear cliente Supabase autenticado
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      }
    );

    // ✅ 5. Probar conexión a Supabase
    const { data, error } = await supabase
      .from("profiles")
      .select("clerk_id, role")
      .limit(2);

    // ✅ 6. Respuesta formateada
    return NextResponse.json({
      message: "✅ Clerk token decoded successfully",
      issuer: decodedPayload.iss,
      claimKey,
      claimData,
      supabaseResponse: { data, error },
    });
  } catch (error) {
    console.error("❌ Debug Token Error:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
