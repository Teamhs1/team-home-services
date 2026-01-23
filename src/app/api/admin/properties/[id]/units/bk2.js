import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =====================
   GET UNITS (LIST)
===================== */
export async function GET(req, { params }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property_id = params.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("clerk_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let query = supabase
    .from("units")
    .select("id, unit")
    .eq("property_id", property_id)
    .order("unit");

  if (profile.role !== "admin") {
    query = query.eq("company_id", profile.company_id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

/* =====================
   CREATE UNIT(S) (ADMIN)
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
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("clerk_id", userId)
      .single();

    if (!profile || !["admin", "client"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cleanUnits = [...new Set(units.map((u) => String(u).trim()))];

    const { data: existingUnits } = await supabase
      .from("units")
      .select("unit")
      .eq("property_id", property_id)
      .in("unit", cleanUnits);

    const existingSet = new Set(existingUnits?.map((u) => u.unit));
    const toInsert = cleanUnits.filter((u) => !existingSet.has(u));

    if (toInsert.length === 0) {
      return NextResponse.json(
        { error: "All units already exist" },
        { status: 409 }
      );
    }

    const insertPayload = toInsert.map((unit) => ({
      property_id,
      unit,
      type,
    }));

    const { data, error } = await supabase
      .from("units")
      .insert(insertPayload)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, created: data.length, units: data },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create units" },
      { status: 500 }
    );
  }
}
