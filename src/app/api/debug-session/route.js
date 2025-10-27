import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId, sessionId } = auth();

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "No user found (auth() returned undefined)",
          hint: "You must be logged in and cookies must be sent with the request",
        }),
        { status: 401 }
      );
    }

    return new Response(
      JSON.stringify({
        message: "✅ Authenticated successfully",
        userId,
        sessionId,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Clerk auth() error:", err);
    return new Response(
      JSON.stringify({
        error: err.message,
        hint: "Check your Clerk setup and cookies",
      }),
      { status: 500 }
    );
  }
}
