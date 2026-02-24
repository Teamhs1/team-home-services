import { NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    // 🔐 1️⃣ Obtener usuario actual
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clerkId, profileId } = await req.json();

    if (!clerkId || !profileId) {
      return NextResponse.json(
        { error: "Missing user identifiers" },
        { status: 400 },
      );
    }

    // 🔎 2️⃣ Perfil del usuario actual
    const { data: currentUser, error: currentError } = await supabaseAdmin
      .from("profiles")
      .select("role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (currentError || !currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🔎 3️⃣ Perfil objetivo
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("id, company_id, role")
      .eq("id", profileId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🚫 No permitir que alguien se elimine a sí mismo
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot delete yourself" },
        { status: 400 },
      );
    }

    // 🔐 4️⃣ Control de permisos
    if (currentUser.role === "super_admin") {
      // ✅ Puede eliminar cualquiera
    } else if (currentUser.role === "admin") {
      if (currentUser.company_id !== targetUser.company_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5️⃣ Eliminar en Supabase
    const { error: supaError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", profileId);

    if (supaError) {
      console.error("SUPABASE DELETE ERROR:", supaError);
      return NextResponse.json({ error: supaError.message }, { status: 500 });
    }

    // 6️⃣ Eliminar en Clerk
    await clerkClient.users.deleteUser(clerkId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    return NextResponse.json(
      { error: "Server error deleting user" },
      { status: 500 },
    );
  }
}
