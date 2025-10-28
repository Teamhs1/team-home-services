import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server"; // ✅ Nueva versión moderna
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { userId, newRole } = await req.json();

    if (!userId || !newRole) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    console.log("🔄 Updating role for:", userId, "→", newRole);

    // ✅ 1. Actualiza el rol en Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { role: newRole },
    });

    // ✅ 2. Verifica los datos actualizados desde Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    console.log("🧠 Clerk metadata now:", clerkUser.publicMetadata);

    // ✅ 3. Actualiza también en Supabase
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("clerk_id", userId)
      .select();

    if (error) throw error;

    console.log("✅ Supabase updated:", data?.[0]);

    return NextResponse.json(
      {
        message: "Role updated successfully",
        newRole,
        userId,
        clerk: clerkUser.publicMetadata,
        supabase: data?.[0],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error updating role:", err);
    return NextResponse.json(
      { message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
