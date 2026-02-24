import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =========================
   BULK HARD DELETE (SECURE)
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

    let permissions;

    try {
      permissions = await getAllowedCompanyIds(userId);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    /* =========================
       👑 SUPER ADMIN
    ========================= */

    if (permissions.role === "super_admin") {
      const { error } = await supabase
        .from("properties")
        .delete()
        .in("id", ids);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        deleted: ids.length,
      });
    }

    /* =========================
       🔐 DELETE PROTECTED
    ========================= */

    const { error } = await supabase
      .from("properties")
      .delete()
      .in("id", ids)
      .in("company_id", permissions.allowedCompanyIds);

    if (error) {
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
      { status: 500 },
    );
  }
}
