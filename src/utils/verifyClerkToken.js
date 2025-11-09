import { importJWK, jwtVerify } from "jose";

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

export async function verifyClerkToken(token) {
  try {
    const { keys } = await getClerkJWKS();
    for (const jwk of keys) {
      try {
        const publicKey = await importJWK(jwk, jwk.alg || "RS256");
        const { payload } = await jwtVerify(token, publicKey);
        if (payload?.sub) return payload; // solo devuelve si hay sub válido
      } catch {}
    }
    throw new Error("Invalid token");
  } catch (err) {
    console.error("❌ verifyClerkToken failed:", err.message);
    return null;
  }
}
