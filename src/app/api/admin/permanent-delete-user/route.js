// /api/admin/permanent-delete-user/route.js

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { profileId } = await req.json();

    if (!profileId) {
      return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
    }

    // 🔎 Obtener perfil que hace la acción
    const { data: currentUser, error: currentError } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (currentError || !currentUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // 🔎 Obtener perfil que se quiere borrar
    const { data: targetProfile, error: targetError } = await supabase
      .from("profiles")
      .select("id, company_id")
      .eq("id", profileId)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json(
        { error: "Target profile not found" },
        { status: 404 },
      );
    }

    /* ============================
       🛑 PERMISSION LOGIC
    ============================ */

    // 🔥 super_admin puede borrar cualquiera
    if (currentUser.role === "super_admin") {
      // allow
    }
    // 🏢 admin solo puede borrar dentro de su company
    else if (
      currentUser.role === "admin" &&
      currentUser.company_id === targetProfile.company_id
    ) {
      // allow
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* ============================
       ⚠️ HARD DELETE
    ============================ */

    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profileId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Permanent delete error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
