import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { importJWK, jwtVerify } from "jose";

// ✅ Clerk JWKS público real
const JWKS_URL =
  "https://choice-liger-25.clerk.accounts.dev/.well-known/jwks.json";

// 🔹 Cache local de claves públicas para evitar fetch repetido
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

// 🔹 Supabase con Service Role Key (permite operaciones seguras sin RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔹 POST /api/jobs/delete
export async function POST(req) {
  try {
    console.log("🟢 Incoming /api/jobs/delete request...");

    // 1️⃣ Obtener y verificar token JWT
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
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    // 3️⃣ Buscar job actual
    const { data: job, error: jobError } = await supabase
      .from("cleaning_jobs")
      .select("id, title, created_by, assigned_to")
      .eq("id", id)
      .single();

    if (jobError || !job) {
      console.warn("⚠️ Job not found:", jobError);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 4️⃣ Autorización: admin puede todo, los demás solo sus propios jobs
    const isAuthorized =
      job.created_by?.trim() === userId?.trim() ||
      job.assigned_to?.trim() === userId?.trim() ||
      ["admin", "super_admin"].includes(role);

    if (!isAuthorized) {
      console.warn(`🚫 Unauthorized delete attempt by ${userId} (${role})`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 5️⃣ Eliminar el job
    const { error: deleteError } = await supabase
      .from("cleaning_jobs")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("❌ Error deleting job:", deleteError.message);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log(`✅ Job '${job.title}' deleted successfully by ${role}`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("🔥 Internal error deleting job:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
