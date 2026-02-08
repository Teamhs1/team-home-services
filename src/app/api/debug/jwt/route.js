// app/api/debug/jwt/route.js
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId, getToken } = auth();

  if (!userId) {
    return new Response("Not authenticated", { status: 401 });
  }

  const token = await getToken({ template: "supabase" });

  const decoded = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString(),
  );

  return Response.json({ decoded });
}
