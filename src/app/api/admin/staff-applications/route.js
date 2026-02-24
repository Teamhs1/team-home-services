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

    const permissions = await getAllowedCompanyIds(userId);

    // 🔎 Perfil actual
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (!currentProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // ❌ Solo admin o super_admin
    if (
      currentProfile.role !== "admin" &&
      currentProfile.role !== "super_admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let query = supabase
      .from("staff_applications")
      .select("*")
      .order("created_at", { ascending: false });

    /* =========================
       👑 SUPER ADMIN
    ========================= */
    if (permissions.isSuperAdmin) {
      // acceso total
    } else {

    /* =========================
       🏢 ADMIN NORMAL
    ========================= */
      query = query.in("company_id", permissions.allowedCompanyIds);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
