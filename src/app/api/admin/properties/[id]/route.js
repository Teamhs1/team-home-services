import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   GET PROPERTY (ADMIN / STAFF)
========================= */
export async function GET(req, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const propertyId = params.id;

    /* =====================
       LOAD PROFILE
    ===================== */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    /* =====================
       LOAD PROPERTY
       - Admin: any company
       - Others: only their company
    ===================== */
    let query = supabase
      .from("properties")
      .select(
        `
        *,
        company:company_id (
          id,
          name
        )
      `
      )
      .eq("id", propertyId);

    if (profile.role !== "admin") {
      query = query.eq("company_id", profile.company_id);
    }

    const { data: property, error: propertyError } = await query.single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    /* =====================
       LOAD UNITS
    ===================== */
    const { data: units } = await supabase
      .from("units")
      .select("*")
      .eq("property_id", propertyId)
      .order("unit", { ascending: true });

    /* =====================
       LOAD KEYS
    ===================== */
    const { data: keys } = await supabase
      .from("keys")
      .select("*")
      .eq("property_id", propertyId)
      .order("tag_code", { ascending: true });

    return NextResponse.json({
      property,
      units: units || [],
      keys: keys || [],
    });
  } catch (err) {
    console.error("❌ GET PROPERTY ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load property" },
      { status: 500 }
    );
  }
}

/* =========================
   PATCH PROPERTY (ADMIN ONLY)
========================= */
export async function PATCH(req, { params }) {
  try {
    const { userId } = await auth();
    const propertyId = params.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* =====================
       LOAD PROFILE
    ===================== */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, address, unit } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("properties")
      .update({
        name,
        address,
        unit,
      })
      .eq("id", propertyId)
      .eq("company_id", profile.company_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ PATCH PROPERTY ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE PROPERTY (ADMIN ONLY)
========================= */
export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth();
    const propertyId = params.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* =====================
       LOAD PROFILE
    ===================== */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("clerk_id", userId)
      .single();

    if (profileError || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* =====================
       HARD DELETE PROPERTY
       (units & keys should be CASCADE in DB)
    ===================== */
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE PROPERTY ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
