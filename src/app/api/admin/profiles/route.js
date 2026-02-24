// /api/admin/profiles/route.js
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔎 Perfil actual
    const { data: currentUser, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !currentUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    let query = supabase
      .from("profiles")
      .select("id, full_name, email, role, company_id")
      .order("full_name");

    /* ================= PERMISSION LOGIC ================= */

    // 🔥 super_admin → ve todos
    if (currentUser.role === "super_admin") {
      // no filter
    }
    // 🏢 admin → solo su company
    else if (currentUser.role === "admin") {
      query = query.eq("company_id", currentUser.company_id);
    }
    // ❌ otros → no acceso
    else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data });
  } catch (err) {
    console.error("❌ USERS LOAD ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
