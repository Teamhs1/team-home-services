import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const { userId } = auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { full_name } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 🔹 1. Actualiza Clerk
    await clerkClient.users.updateUser(userId, {
      firstName: full_name.split(" ")[0] || "",
      lastName: full_name.split(" ").slice(1).join(" ") || "",
    });

    // 🔹 2. Actualiza Supabase
    const { error } = await supabase
      .from("profiles")
      .update({ full_name })
      .eq("clerk_id", userId);

    if (error) throw error;

    return new Response("Profile updated", { status: 200 });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    return new Response("Server error", { status: 500 });
  }
}
