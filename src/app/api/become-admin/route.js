import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    console.log("❌ No userId found (not logged in)");
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("🧑 User ID:", userId);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // ✅ 1. Actualiza metadata en Clerk
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: "admin" },
    });
    console.log("✅ Clerk metadata updated");

    // ✅ 2. Actualiza rol en Supabase
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("clerk_id", userId)
      .select();

    if (error) {
      console.error("❌ Supabase update error:", error);
      throw error;
    }

    console.log("✅ Supabase updated:", data);

    return new Response("✅ You are now an admin!", { status: 200 });
  } catch (err) {
    console.error("❌ Error setting admin role:", err.message);
    return new Response("Server error", { status: 500 });
  }
}
