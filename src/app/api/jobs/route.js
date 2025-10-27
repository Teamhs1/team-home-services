import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { importJWK, jwtVerify } from "jose";

// ✅ Clerk JWKS público
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

// ✅ Verificación del JWT emitido por Clerk
async function verifyClerkJWT(token) {
  const { keys } = await getClerkJWKS();
  let lastError;

  for (const jwk of keys) {
    try {
      const publicKey = await importJWK(jwk, jwk.alg || "RS256");
      const { payload } = await jwtVerify(token, publicKey, {
        issuer: undefined,
        audience: undefined,
      });
      console.log("🧾 Clerk JWT verified successfully:", {
        sub: payload.sub,
        email: payload.email,
        public_metadata: payload.public_metadata,
      });
      return payload;
    } catch (err) {
      lastError = err;
    }
  }

  console.error("❌ Clerk JWT verification failed:", lastError?.message);
  throw lastError || new Error("JWT verification failed");
}

// 🔹 Supabase con Server Key (permite lectura segura)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔹 GET /api/jobs
export async function GET(req) {
  try {
    console.log("🟢 Incoming /api/jobs request...");

    // 🧠 Leer encabezado Authorization de la solicitud
    const authHeader = req.headers.get("authorization");
    console.log("🔐 Auth header recibido:", authHeader);

    if (!authHeader) {
      console.warn("🚫 Falta el header Authorization");
      return NextResponse.json(
        { error: "Unauthorized (no header)" },
        { status: 401 }
      );
    }

    // Extraer token de forma flexible
    const token = authHeader.replace(/bearer\s+/i, "").trim();
    if (!token) {
      console.warn("🚫 No se encontró token dentro del header");
      return NextResponse.json(
        { error: "Unauthorized (no token)" },
        { status: 401 }
      );
    }

    // 🧾 Verificar el token con Clerk
    let session;
    try {
      session = await verifyClerkJWT(token);
    } catch (verifyErr) {
      console.error("❌ Error verificando token Clerk:", verifyErr.message);
      return NextResponse.json(
        { error: "Unauthorized (invalid or expired token)" },
        { status: 401 }
      );
    }

    if (!session?.sub) {
      console.warn("🚫 Token válido pero sin sub (userId)");
      return NextResponse.json(
        { error: "Unauthorized (invalid payload)" },
        { status: 401 }
      );
    }

    const userId = session.sub;
    const role =
      session?.public_metadata?.role || session?.metadata?.role || "client";

    console.log(`🧠 Fetching jobs for user: ${userId} (role: ${role})`);

    // 🔹 Query dinámico según el rol del usuario
    let query = supabase.from("cleaning_jobs").select("*");

    if (role === "admin") {
      query = query.order("scheduled_date", { ascending: true });
    } else if (role === "staff") {
      query = query.or(
        `assigned_to.eq.${userId},assigned_to.ilike.%${userId}%`
      );
    } else {
      query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
    }

    const { data, error } = await query.order("scheduled_date", {
      ascending: true,
    });

    if (error) throw error;

    console.log(`✅ ${data?.length || 0} jobs fetched for ${role}`);
    return NextResponse.json(data);
  } catch (err) {
    console.error("💥 Error in /api/jobs:", err);
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
