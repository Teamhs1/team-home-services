import jwt from "jsonwebtoken";

/**
 * ✅ Verifica y decodifica el JWT recibido desde Clerk
 * usado por las rutas API que interactúan con Supabase.
 */
export async function verifyClerkJWT(token) {
  try {
    if (!token) throw new Error("Missing token");

    // Clerk publica su clave pública en formato PEM
    const jwksUri = "https://clerk.dev/.well-known/jwks.json";
    const key = await getClerkKey(token, jwksUri);

    // Decodifica y verifica el JWT
    const payload = jwt.verify(token, key, { algorithms: ["RS256"] });
    return payload;
  } catch (err) {
    console.error("❌ verifyClerkJWT failed:", err.message);
    throw new Error("Invalid or expired token");
  }
}

/**
 * 🔹 Descarga y cachea las claves públicas de Clerk (JWKS)
 */
async function getClerkKey(token, jwksUri) {
  const [header] = token.split(".");
  const { kid } = JSON.parse(Buffer.from(header, "base64").toString());

  const res = await fetch(jwksUri);
  const { keys } = await res.json();
  const jwk = keys.find((k) => k.kid === kid);
  if (!jwk) throw new Error("Clerk public key not found");

  return jwkToPem(jwk);
}

/**
 * 🔹 Convierte la clave JWK a formato PEM
 */
function jwkToPem(jwk) {
  const modulus = Buffer.from(jwk.n, "base64");
  const exponent = Buffer.from(jwk.e, "base64");

  const pubKey = {
    kty: "RSA",
    n: modulus,
    e: exponent,
  };

  return jwt.JWK2PEM(pubKey);
}
