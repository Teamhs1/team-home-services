import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   BULK HARD DELETE (ADMIN)
========================= */
export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    /* =====================
       VALIDATE ADMIN
    ===================== */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* =====================
       HARD DELETE
    ===================== */
    const { error } = await supabase.from("properties").delete().in("id", ids);

    if (error) {
      console.error("❌ BULK DELETE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: ids.length,
    });
  } catch (err) {
    console.error("❌ BULK DELETE FATAL:", err);
    return NextResponse.json(
      { error: "Failed to delete properties" },
      { status: 500 }
    );
  }
}
