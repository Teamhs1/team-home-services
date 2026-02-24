import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    let permissions;

    try {
      permissions = await getAllowedCompanyIds(userId);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    /* =========================
       👑 SUPER ADMIN → acceso total
    ========================= */

    if (permissions.role === "super_admin") {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id)
        .not("deleted_at", "is", null);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    /* =========================
       🔐 DELETE protegido por company
    ========================= */

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id)
      .in("company_id", permissions.allowedCompanyIds)
      .not("deleted_at", "is", null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Force delete invoice error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
