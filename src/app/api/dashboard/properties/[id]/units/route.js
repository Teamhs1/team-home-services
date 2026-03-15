import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { PLAN_LIMITS } from "@/lib/planLimits";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =====================
   GET UNITS (LIST)
===================== */
export async function GET(req, { params }) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: property_id } = params;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, active_company_id, role")
    .eq("clerk_id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const companyId = profile.active_company_id || profile.company_id;

  let query = supabase
    .from("units")
    .select("id, unit")
    .eq("property_id", property_id)
    .order("unit");

  if (!["admin", "super_admin"].includes(profile.role)) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

/* =====================
   CREATE UNIT(S)
===================== */
export async function POST(req, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const property_id = params.id;
    const body = await req.json();

    const units = body.units;
    const type = body.type || null;

    if (!property_id || !Array.isArray(units) || units.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid units array" },
        { status: 400 },
      );
    }

    /* =====================
       LOAD PROFILE
    ===================== */

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id, active_company_id, role")
      .eq("clerk_id", userId)
      .single();

    if (
      profileError ||
      !profile ||
      !["super_admin", "admin", "client"].includes(profile.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companyId = profile.active_company_id || profile.company_id;

    /* =====================
       VERIFY PROPERTY
    ===================== */

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("company_id")
      .eq("id", property_id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    if (
      !["super_admin", "admin"].includes(profile.role) &&
      property.company_id !== companyId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* =====================
       CLEAN UNITS
    ===================== */

    const cleanUnits = [
      ...new Set(
        units.map((u) => String(u).trim()).filter((u) => u.length > 0),
      ),
    ];

    if (cleanUnits.length === 0) {
      return NextResponse.json(
        { error: "No valid units provided" },
        { status: 400 },
      );
    }

    const { data: existingUnits } = await supabase
      .from("units")
      .select("unit")
      .eq("property_id", property_id)
      .in("unit", cleanUnits);

    const existingSet = new Set((existingUnits || []).map((u) => u.unit));

    const toInsert = cleanUnits.filter((u) => !existingSet.has(u));

    if (toInsert.length === 0) {
      return NextResponse.json(
        { error: "All units already exist" },
        { status: 409 },
      );
    }

    /* =====================
       PLAN LIMIT CHECK
    ===================== */

    const { data: company } = await supabase
      .from("companies")
      .select("plan_type")
      .eq("id", companyId)
      .single();

    const { count: existingUnitsCount } = await supabase
      .from("units")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    const plan = company?.plan_type;

    if (!plan) {
      return NextResponse.json(
        {
          error: "Company has no active plan",
          upgradeRequired: true,
        },
        { status: 403 },
      );
    }

    const planLimit = PLAN_LIMITS[plan]?.units;

    if (existingUnitsCount + toInsert.length > planLimit) {
      return NextResponse.json(
        {
          error: `Unit limit reached for ${plan} plan (${planLimit})`,
          upgradeRequired: true,
          plan,
          limit: planLimit,
          resource: "units",
        },
        { status: 403 },
      );
    }

    /* =====================
       INSERT UNITS
    ===================== */

    const insertPayload = toInsert.map((unit) => ({
      property_id,
      unit,
      type,
      company_id: property.company_id,
    }));

    const { data, error } = await supabase
      .from("units")
      .insert(insertPayload)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        created: data.length,
        units: data,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("❌ CREATE UNITS ERROR:", err);

    return NextResponse.json(
      { error: "Failed to create units" },
      { status: 500 },
    );
  }
}
