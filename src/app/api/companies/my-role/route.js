import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req, { params }) {
  try {
    const { userId, getToken } = await auth();
    const { companyId } = params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing company id" },
        { status: 400 },
      );
    }

    const token = await getToken({ template: "supabase" });

    if (!token) {
      return NextResponse.json({ error: "No Supabase token" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    );

    // 1️⃣ Obtener profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 🔥 SUPER ADMIN BYPASS
    if (profile.role === "super_admin") {
      return NextResponse.json({
        role: "super_admin",
        systemRole: profile.role,
      });
    }

    // 2️⃣ Buscar membership
    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("role")
      .eq("company_id", companyId)
      .eq("profile_id", profile.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Not a member of this company" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      role: membership.role,
      systemRole: profile.role,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
