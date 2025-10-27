import { NextResponse } from "next/server";
import { importJWK, jwtVerify, SignJWT } from "jose";

const CLERK_JWKS_URL =
  "https://crucial-teal-42.clerk.accounts.dev/.well-known/jwks.json";
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

async function verifyClerkTokenRS256(token) {
  const res = await fetch(CLERK_JWKS_URL);
  const { keys } = await res.json();

  console.log(
    "🪶 Clerk JWKS keys:",
    keys.map((k) => k.kid)
  );
  const header = JSON.parse(
    Buffer.from(token.split(".")[0], "base64").toString()
  );
  console.log("📦 Clerk token header:", header);

  for (const jwk of keys) {
    try {
      console.log(`🔍 Trying key ${jwk.kid}...`);
      const key = await importJWK(jwk, "RS256");
      const { payload } = await jwtVerify(token, key, {
        algorithms: ["RS256"],
      });
      console.log("✅ Verified with key:", jwk.kid);
      return payload;
    } catch (err) {
      console.warn(`❌ Key ${jwk.kid} failed:`, err.message);
      continue;
    }
  }

  throw new Error(
    "Invalid Clerk token signature — no matching JWKS key worked."
  );
}

export async function POST(req) {
  try {
    const { token } = await req.json();
    if (!token) throw new Error("Missing Clerk token");
    console.log("🪪 Received Clerk token:", token.slice(0, 50) + "...");

    const payload = await verifyClerkTokenRS256(token);
    console.log("✅ Verified payload:", payload);

    const signed = await new SignJWT({
      sub: payload.sub,
      email: payload.email,
      role: "authenticated",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(SUPABASE_JWT_SECRET));

    return NextResponse.json({
      message: "✅ Clerk token verified and Supabase token created",
      payload,
      supabaseToken: signed,
    });
  } catch (error) {
    console.error("❌ Proxy error (detailed):", error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
