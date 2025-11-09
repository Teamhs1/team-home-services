import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { importJWK, jwtVerify } from "jose";

const JWKS_URL =
  process.env.NEXT_PUBLIC_CLERK_JWT_ISSUER + "/.well-known/jwks.json";

let cachedKeys = null;
async function getClerkJWKS() {
  if (cachedKeys) return cachedKeys;
  const res = await fetch(JWKS_URL);
  cachedKeys = await res.json();
  return cachedKeys;
}

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

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({
        token: false,
        error: "Missing Authorization",
      });

    const token = authHeader.replace("Bearer ", "").trim();
    const payload = await verifyClerkJWT(token);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { data, error } = await supabase
      .from("cleaning_jobs")
      .select("*")
      .limit(5);
    return NextResponse.json({ token: true, user: payload.sub, data, error });
  } catch (err) {
    return NextResponse.json(
      { token: false, error: err.message },
      { status: 401 }
    );
  }
}
