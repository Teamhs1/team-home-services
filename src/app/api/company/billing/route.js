import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get("company_id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 🔹 Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("active_company_id, role")
      .eq("clerk_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let companyId = profile.active_company_id;

    // 👑 SUPER ADMIN → puede elegir company
    if (profile.role === "super_admin" && companyIdParam) {
      companyId = companyIdParam;
    }

    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 403 });
    }

    const { data: company } = await supabase
      .from("companies")
      .select("billing_enabled")
      .eq("id", companyId)
      .single();

    return NextResponse.json({
      billing_enabled: company?.billing_enabled ?? true,
      company_id: companyId,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
