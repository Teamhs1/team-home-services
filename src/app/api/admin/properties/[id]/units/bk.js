import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =====================
   CREATE UNIT(S) (ADMIN)
===================== */
export async function POST(req, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const property_id = params?.id;
    const body = await req.json();

    const units = body.units; // 👈 ARRAY
    const type = body.type || null;

    if (!property_id || !Array.isArray(units) || units.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid units array" },
        { status: 400 }
      );
    }

    /* =====================
       PROFILE (ADMIN ONLY)
    ===================== */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: admin only" },
        { status: 403 }
      );
    }

    /* =====================
   VALIDATE PROPERTY
===================== */
    let propertyQuery = supabase
      .from("properties")
      .select("id, company_id")
      .eq("id", property_id);

    // 🔓 SOLO restringir company si NO es admin
    if (profile.role !== "admin") {
      propertyQuery = propertyQuery.eq("company_id", profile.company_id);
    }

    const { data: property, error: propertyError } =
      await propertyQuery.single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: "Property not found or access denied" },
        { status: 404 }
      );
    }

    /* =====================
       CLEAN + VALIDATE UNITS
    ===================== */
    const cleanUnits = units.map((u) => String(u).trim()).filter(Boolean);

    const uniqueUnits = [...new Set(cleanUnits)];

    if (uniqueUnits.length === 0) {
      return NextResponse.json(
        { error: "No valid units provided" },
        { status: 400 }
      );
    }

    /* =====================
       DUPLICATE CHECK (DB)
    ===================== */
    const { data: existingUnits } = await supabase
      .from("units")
      .select("unit")
      .eq("property_id", property_id)
      .in("unit", uniqueUnits);

    const existingSet = new Set(existingUnits?.map((u) => u.unit));

    const toInsert = uniqueUnits.filter((u) => !existingSet.has(u));

    if (toInsert.length === 0) {
      return NextResponse.json(
        {
          error: "All units already exist",
          duplicates: [...existingSet],
        },
        { status: 409 }
      );
    }

    /* =====================
       INSERT UNITS (BULK)
    ===================== */
    const insertPayload = uniqueUnits.map((unit) => ({
      property_id,
      unit,
      type,
    }));

    const { data, error } = await supabase
      .from("units")
      .insert(insertPayload)
      .select();

    if (error) {
      console.error("❌ CREATE UNITS ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        created: data.length,
        units: data,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ CREATE UNITS FATAL:", err);
    return NextResponse.json(
      { error: "Failed to create units" },
      { status: 500 }
    );
  }
}
