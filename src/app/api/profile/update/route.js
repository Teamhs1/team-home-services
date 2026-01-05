import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    /* ======================
       AUTH
    ====================== */
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { full_name, phone } = await req.json();

    if (!full_name) {
      return new Response("Missing full_name", { status: 400 });
    }

    /* ======================
       UPDATE CLERK (name)
    ====================== */
    try {
      await clerkClient.users.updateUser(userId, {
        firstName: full_name.split(" ")[0] || "",
        lastName: full_name.split(" ").slice(1).join(" ") || "",
      });
    } catch (err) {
      console.warn("⚠️ Clerk update failed (continuing):", err.message);
    }

    /* ======================
       UPDATE SUPABASE
    ====================== */
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_id", userId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("❌ Profile update error:", err);
    return new Response("Server error", { status: 500 });
  }
}
