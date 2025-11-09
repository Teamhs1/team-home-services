import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { importJWK, jwtVerify } from "jose";

// 🔹 URL del JWKS de Clerk (ajústalo según tu instancia)
const JWKS_URL =
  "https://choice-liger-25.clerk.accounts.dev/.well-known/jwks.json";

let cachedKeys = null;
async function getClerkJWKS() {
  if (cachedKeys) return cachedKeys;
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error("Unable to fetch Clerk JWKS");
  cachedKeys = await res.json();
  return cachedKeys;
}

// 🔹 Verifica el token JWT firmado por Clerk
async function verifyClerkJWT(token) {
  const { keys } = await getClerkJWKS();
  for (const jwk of keys) {
    try {
      const publicKey = await importJWK(jwk, jwk.alg || "RS256");
      const { payload } = await jwtVerify(token, publicKey);
      return payload;
    } catch {}
  }
  throw new Error("Invalid token");
}

export async function POST(req) {
  try {
    console.log("🟢 /api/jobs/update called...");

    // 1️⃣ Leer el Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid token" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // 2️⃣ Verificar JWT Clerk (solo para validar firma)
    const payload = await verifyClerkJWT(token);
    const userId = payload.sub;
    const role =
      payload["https://choice-liger-25.clerk.accounts.dev/jwt/claims"]?.role ||
      "client";

    console.log("👤 Authenticated user:", { userId, role });

    // 3️⃣ Crear cliente Supabase autenticado con ese token (para RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    // 4️⃣ Leer el body
    const body = await req.json();
    const { id, status, assigned_to } = body;
    if (!id)
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });

    const updates = {};
    if (status) updates.status = status;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;

    console.log("🚀 Attempting update:", { id, updates });

    // 5️⃣ Ejecutar el UPDATE bajo RLS
    const { data, error } = await supabase
      .from("cleaning_jobs")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      console.error("❌ Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (!data?.length) {
      return NextResponse.json({ error: "No record updated" }, { status: 404 });
    }

    console.log(`✅ Job ${id} updated successfully by ${userId} (${role})`);
    return NextResponse.json({
      message: "Job updated successfully",
      data,
    });
  } catch (err) {
    console.error("💥 Fatal error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
