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

    // 🔎 Obtener perfil del usuario actual
    const { data: currentUser, error: userError } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🔎 Obtener perfil objetivo
    const { data: targetProfile, error: targetError } = await supabase
      .from("profiles")
      .select("id, company_id")
      .eq("id", profileId)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 🔐 CONTROL DE PERMISOS
    if (currentUser.role === "super_admin") {
      // ✅ Puede reactivar cualquiera
    } else if (currentUser.role === "admin") {
      // ✅ Solo su propia company
      if (currentUser.company_id !== targetProfile.company_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ♻️ Reactivar
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        status: "active",
        deleted_at: null,
      })
      .eq("id", profileId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Reactivate user error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
