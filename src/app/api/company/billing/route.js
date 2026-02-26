import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 1️⃣ Obtener profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile?.active_company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 403 });
    }

    // 2️⃣ Obtener billing status
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("billing_enabled")
      .eq("id", profile.active_company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 403 });
    }

    return NextResponse.json({
      billing_enabled: company.billing_enabled,
    });
  } catch (err) {
    console.error("BILLING API ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
