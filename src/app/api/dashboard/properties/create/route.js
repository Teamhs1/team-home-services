import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { PLAN_LIMITS } from "@/lib/planLimits";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* =====================
     LOAD PROFILE
  ===================== */

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, active_company_id")
    .eq("clerk_id", userId)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  if (profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companyId = profile.active_company_id;

  /* =====================
   LOAD COMPANY PLAN
===================== */

  const { data: company } = await supabase
    .from("companies")
    .select("plan_type")
    .eq("id", companyId)
    .single();

  const plan = company?.plan_type;

  if (!PLAN_LIMITS[plan]) {
    return NextResponse.json(
      { error: `Invalid company plan: ${plan}` },
      { status: 400 },
    );
  }

  const planLimit = PLAN_LIMITS[plan].properties;

  /* =====================
     COUNT PROPERTIES
  ===================== */

  const { count } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (planLimit !== Infinity && count >= planLimit) {
    return NextResponse.json(
      {
        error: "Property limit reached",
        upgradeRequired: true,
        plan,
        limit: planLimit,
        resource: "properties",
      },
      { status: 403 },
    );
  }

  /* =====================
     CREATE PROPERTY
  ===================== */

  const body = await req.json();

  const { data, error: insertError } = await supabase
    .from("properties")
    .insert({
      ...body,
      company_id: companyId,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
