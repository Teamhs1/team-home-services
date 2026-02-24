import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { profileId } = await req.json();

    if (!profileId) {
      return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
    }

    // 🔎 Usuario actual
    const { data: currentUser, error: currentError } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (currentError || !currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🔎 Usuario objetivo
    const { data: targetUser, error: targetError } = await supabase
      .from("profiles")
      .select("id, company_id")
      .eq("id", profileId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🚫 No permitir desactivarse a sí mismo
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot deactivate yourself" },
        { status: 400 },
      );
    }

    // 🔐 Control jerárquico
    if (currentUser.role === "super_admin") {
      // ✅ Puede desactivar cualquiera
    } else if (currentUser.role === "admin") {
      if (currentUser.company_id !== targetUser.company_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🧊 Soft delete
    const { error } = await supabase
      .from("profiles")
      .update({
        status: "inactive",
        deleted_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Deactivate error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
