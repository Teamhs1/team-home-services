// app/api/company/overview/route.js

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let companyId = searchParams.get("company_id");

    /* ===============================
       🔎 Resolve company_id FIRST
    =============================== */

    if (!companyId) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, active_company_id")
        .eq("clerk_id", userId)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 },
        );
      }

      // 🔥 Si no tiene company activa → devolver no_company (NO ERROR)
      if (!profile.active_company_id) {
        return NextResponse.json({
          no_company: true,
        });
      }

      companyId = profile.active_company_id;
    }

    /* ===============================
       🔐 Permission check AFTER company exists
    =============================== */

    const permissions = await getAllowedCompanyIds(userId);

    if (permissions.role !== "super_admin") {
      if (!permissions.allowedCompanyIds.includes(companyId)) {
        return NextResponse.json(
          { error: "Not authorized for this company" },
          { status: 403 },
        );
      }
    }

    /* ===============================
       📊 MEMBER COUNT
    =============================== */

    const { count: memberCount } = await supabase
      .from("company_members")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    /* ===============================
       🏠 PROPERTY COUNT
    =============================== */

    const { count: propertyCount } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    /* ===============================
       🏢 COMPANY INFO + SUBSCRIPTION
    =============================== */

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select(
        `
        logo_url,
        name,
        created_at,
        plan_type,
        subscription_status,
        billing_enabled,
        cancel_at_period_end,
        subscription_current_period_end,
        max_units
      `,
      )
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    /* ===============================
       ✅ RESPONSE
    =============================== */

    return NextResponse.json({
      no_company: false,

      company_id: companyId,
      company_name: company.name,
      created_at: company.created_at,
      logo: company.logo_url,

      members: memberCount ?? 0,
      properties: propertyCount ?? 0,

      plan_type: company.plan_type || "free",
      subscription_status: company.subscription_status,
      billing_enabled: company.billing_enabled || false,
      cancel_at_period_end: company.cancel_at_period_end || false,
      subscription_current_period_end:
        company.subscription_current_period_end || null,

      max_units: company.max_units ?? 1,
    });
  } catch (err) {
    console.error("COMPANY OVERVIEW ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
