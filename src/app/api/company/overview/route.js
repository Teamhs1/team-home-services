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
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = await getAllowedCompanyIds(userId);

    const { searchParams } = new URL(req.url);
    let companyId = searchParams.get("company_id");

    /* ===============================
       🔎 Resolve company_id
    =============================== */

    if (!companyId) {
      // 1️⃣ Try active_company_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_company_id")
        .eq("clerk_id", userId)
        .single();

      if (profile?.active_company_id) {
        companyId = profile.active_company_id;
      } else {
        // 2️⃣ Fallback → first company_members match
        const { data: membership } = await supabase
          .from("company_members")
          .select("company_id")
          .eq("profile_id", profile?.id || null)
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
       🖼 COMPANY INFO
    =============================== */
    const { data: company } = await supabase
      .from("companies")
      .select("logo_url, name")
      .eq("id", companyId)
      .single();

    return NextResponse.json({
      company_id: companyId,
      company_name: company?.name || null,
      logo: company?.logo_url || null,
      members: memberCount || 0,
      properties: propertyCount || 0,
    });
  } catch (err) {
    console.error("COMPANY OVERVIEW ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
