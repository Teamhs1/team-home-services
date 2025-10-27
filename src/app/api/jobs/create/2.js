import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { importJWK, jwtVerify } from "jose";

// ✅ URL del JWKS público de tu instancia actual de Clerk
const JWKS_URL =
  "https://choice-liger-25.clerk.accounts.dev/.well-known/jwks.json";

// Cache para JWKS
let cachedKeys = null;
async function getClerkJWKS() {
  if (cachedKeys) return cachedKeys;
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error("Unable to fetch Clerk JWKS");
  cachedKeys = await res.json();
  return cachedKeys;
}

// ✅ Verificación flexible del JWT de Clerk
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
      return payload;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("JWT verification failed");
}

export async function POST(req) {
  try {
    // 🔹 Verificación del header de autorización
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn("❌ Missing Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const session = await verifyClerkJWT(token);

    const clerkId = session.sub; // 👈 Clerk ID del usuario autenticado
    const role =
      session?.public_metadata?.role || session?.metadata?.role || "client";

    console.log(`🧠 Verified Clerk user ${clerkId} (${role})`);

    // 🧩 Validamos la clave del servicio
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Missing SUPABASE_SERVICE_ROLE_KEY in environment" },
        { status: 500 }
      );
    }

    // ✅ Cliente Supabase Admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await req.json();
    const { title, assigned_to, service_type, scheduled_date } = body;

    // ⚠️ Validaciones básicas
    if (!title || !scheduled_date) {
      return NextResponse.json(
        { error: "Missing required fields (title or scheduled_date)" },
        { status: 400 }
      );
    }

    // 🚀 Construir objeto seguro
    const newJob = {
      title: title.trim(),
      assigned_to: assigned_to ? assigned_to.trim() : null,
      created_by: clerkId, // el creador siempre es quien hace la solicitud
      service_type: service_type || "standard",
      scheduled_date,
      status: "pending",
    };

    // 🧠 Registro de depuración
    console.log("📦 Creating job:");
    console.table(newJob);

    if (!assigned_to) {
      console.warn("⚠️ Job created without assigned staff — unassigned job.");
    } else {
      console.log(`👤 Assigned to staff: ${assigned_to}`);
    }

    // 🚀 Insertar en Supabase
    const { data, error, status } = await supabase
      .from("cleaning_jobs")
      .insert(newJob)
      .select();

    // ⚠️ Si Supabase responde 401
    if (status === 401) {
      return NextResponse.json(
        {
          error:
            "Unauthorized: The SERVICE_ROLE_KEY may be invalid or not loaded correctly.",
        },
        { status: 401 }
      );
    }

    if (error) {
      console.error("❌ Supabase insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Job created successfully:");
    console.table(data);

    return NextResponse.json({
      message: "✅ Job created successfully",
      data,
    });
  } catch (err) {
    console.error("💥 Error in /api/jobs/create:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
