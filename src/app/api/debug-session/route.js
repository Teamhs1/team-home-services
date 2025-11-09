import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId, sessionId, getToken } = auth();

  // Intentar recuperar token
  let jwt = null;
  try {
    jwt = await getToken({ template: "supabase" });
  } catch (err) {
    jwt = `❌ Error al obtener token: ${err.message}`;
  }

  return NextResponse.json({
    userId: userId || null,
    sessionId: sessionId || null,
    jwtSnippet: jwt ? jwt.slice(0, 50) + "..." : null,
  });
}
