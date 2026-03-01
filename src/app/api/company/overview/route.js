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

    const permissions = await getAllowedCompanyIds(userId);

    const { searchParams } = new URL(req.url);
    let companyId = searchParams.get("company_id");

    /* ===============================
       🔎 Resolve company_id
    =============================== */

    if (!companyId) {
      // 1️⃣ Get full profile (needed for fallback)
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

      // 2️⃣ Use active_company_id first
      if (profile.active_company_id) {
        companyId = profile.active_company_id;
      } else {
        // 3️⃣ Fallback → first membership
        const { data: membership } = await supabase
          .from("company_members")
          .select("company_id")
          .eq("profile_id", profile.id)
          .limit(1)
          .single();

        if (membership?.company_id) {
          companyId = membership.company_id;
        }
      }

      if (!companyId) {
        return NextResponse.json(
          { error: "No company found for user" },
          { status: 400 },
        );
      }
    }

    /* ===============================
       🔒 Permission check
    =============================== */

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

    const { count: memberCount, error: memberError } = await supabase
      .from("company_members")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    if (memberError) {
      console.error("Member count error:", memberError);
    }

    /* ===============================
       🏠 PROPERTY COUNT
    =============================== */

    const { count: propertyCount, error: propertyError } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    if (propertyError) {
      console.error("Property count error:", propertyError);
    }

    /* ===============================
       🖼 COMPANY INFO
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
        billing_enabled
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
      company_id: companyId,
      company_name: company.name || null,
      created_at: company.created_at || null,
      logo: company.logo_url || null,
      members: memberCount ?? 0,
      properties: propertyCount ?? 0,

      // 🔥 Subscription fields
      plan_type: company.plan_type || null,
      subscription_status: company.subscription_status || null,
      billing_enabled: company.billing_enabled || false,
    });
  } catch (err) {
    console.error("COMPANY OVERVIEW ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
