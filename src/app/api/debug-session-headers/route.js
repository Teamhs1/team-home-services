import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const allHeaders = Object.fromEntries(headers());
  const session = auth();

  return new Response(
    JSON.stringify({
      clerkHeaders: {
        authorization: allHeaders.authorization || "❌ none",
        cookie: allHeaders.cookie?.includes("__session")
          ? "✅ session cookie found"
          : "❌ no session cookie",
      },
      authResult: session,
    }),
    { status: 200 }
  );
}
