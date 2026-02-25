import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    /* =========================
       🔐 GET PERMISSIONS
    ========================= */
    const permissions = await getAllowedCompanyIds(userId);

    if (!permissions) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* =========================
       👮 ROLE CHECK
    ========================= */
    if (permissions.role !== "admin" && permissions.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* =========================
       📊 QUERY
    ========================= */
    let query = supabase
      .from("staff_applications")
      .select("*")
      .order("created_at", { ascending: false });

    /* =========================
       👑 SUPER ADMIN
    ========================= */
    if (!permissions.isSuperAdmin) {
      // Admin normal → solo sus compañías
      if (
        !permissions.allowedCompanyIds ||
        permissions.allowedCompanyIds.length === 0
      ) {
        return NextResponse.json({ applications: [] });
      }

      query = query.in("company_id", permissions.allowedCompanyIds);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    /* =========================
       ✅ RESPONSE FORMAT
    ========================= */
    return NextResponse.json({
      applications: data || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
