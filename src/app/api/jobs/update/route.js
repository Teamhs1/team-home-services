import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { importJWK, jwtVerify } from "jose";

// ✅ Clerk JWKS público real de tu proyecto
const JWKS_URL =
  "https://choice-liger-25.clerk.accounts.dev/.well-known/jwks.json";

// 🧩 Cache local de claves públicas
let cachedKeys = null;
async function getClerkJWKS() {
  if (cachedKeys) return cachedKeys;
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error("Unable to fetch Clerk JWKS");
  cachedKeys = await res.json();
  return cachedKeys;
}

// ✅ Verificar JWT emitido por Clerk
async function verifyClerkJWT(token) {
  const { keys } = await getClerkJWKS();
  let lastError;
  for (const jwk of keys) {
    try {
      const publicKey = await importJWK(jwk, jwk.alg || "RS256");
      const { payload } = await jwtVerify(token, publicKey);
      console.log("🧾 Clerk JWT verified for:", payload.sub);
      return payload;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("JWT verification failed");
}

// 🔹 Supabase con Service Role Key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔹 POST /api/jobs/update
export async function POST(req) {
  try {
    console.log("🟢 Incoming /api/jobs/update request...");

    // 1️⃣ Obtener token y verificar JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace(/bearer\s+/i, "").trim();
    const session = await verifyClerkJWT(token);

    // 🧠 Leer claims del namespace correcto (igual al de Supabase)
    const claims =
      session["https://choice-liger-25.supabase.co/jwt/claims"] || {};

    const userId = claims.sub_id || session.sub;
    const role =
      claims.role ||
      session?.public_metadata?.role ||
      session?.metadata?.role ||
      "client";

    console.log("👤 Authenticated as:", { userId, role });

    // 2️⃣ Leer body
    const body = await req.json();
    const { id, status, assigned_to } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    // 3️⃣ Buscar trabajo actual
    const { data: job, error: jobError } = await supabase
      .from("cleaning_jobs")
      .select("id, created_by, assigned_to, status")
      .eq("id", id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 4️⃣ Verificar permisos
    const isAuthorized =
      job.created_by?.trim() === userId?.trim() ||
      job.assigned_to?.trim() === userId?.trim() ||
      ["admin", "super_admin"].includes(role);

    if (!isAuthorized) {
      console.warn("🚫 Unauthorized update attempt by:", userId, "role:", role);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 5️⃣ Construir los datos a actualizar
    const updates = {};
    if (status) updates.status = status;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;

    if (Object.keys(updates).length === 0)
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );

    // 6️⃣ Actualizar job en Supabase
    const { data, error } = await supabase
      .from("cleaning_jobs")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;

    console.log(`✅ Job ${id} updated successfully:`, updates);
    return NextResponse.json({
      message: "Job updated successfully",
      updates,
      data,
    });
  } catch (err) {
    console.error("💥 Error in /api/jobs/update:", err);
    const status =
      err.message?.includes("Unauthorized") || err.code === "ERR_JWT_EXPIRED"
        ? 401
        : 500;
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status }
    );
  }
}
