import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =====================
   GET UNIT (ADMIN)
===================== */
export async function GET(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: property_id, unitId } = params;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("clerk_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: unit, error } = await supabase
      .from("units")
      .select(
        `
    *,
    property:properties (
      id,
      address,
      postal_code,
      latitude,
      longitude,
      company_id,
      year_built
    )
  `
      )

      .eq("id", unitId)
      .eq("property_id", property_id)
      .single();

    if (error || !unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // 🔐 seguridad por company
    if (
      profile.role !== "admin" &&
      unit.property.company_id !== profile.company_id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ unit });
  } catch (err) {
    console.error("❌ GET UNIT ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* =====================
   DELETE UNIT (ADMIN)
===================== */
export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: property_id, unitId } = params;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("clerk_id", userId)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: unit } = await supabase
      .from("units")
      .select("id")
      .eq("id", unitId)
      .eq("property_id", property_id)
      .single();

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    const { error } = await supabase.from("units").delete().eq("id", unitId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE UNIT ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete unit" },
      { status: 500 }
    );
  }
}

/* =====================
   PATCH UNIT (ADMIN)
===================== */
export async function PATCH(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: property_id, unitId } = params;
    const body = await req.json();

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("clerk_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: unit } = await supabase
      .from("units")
      .select(
        `
        id,
        property:properties (
          company_id
        )
        `
      )
      .eq("id", unitId)
      .eq("property_id", property_id)
      .single();

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // 🔐 seguridad por company
    if (
      profile.role !== "admin" &&
      unit.property.company_id !== profile.company_id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates = {};

    if (typeof body.latitude === "number") updates.latitude = body.latitude;
    if (typeof body.longitude === "number") updates.longitude = body.longitude;

    if (typeof body.postal_code === "string") {
      updates.postal_code =
        body.postal_code.trim() === "" ? null : body.postal_code.trim();
    }

    if (typeof body.is_for_rent === "boolean")
      updates.is_for_rent = body.is_for_rent;

    if (body.rent_price === null || typeof body.rent_price === "number")
      updates.rent_price = body.rent_price;

    if (body.available_from !== undefined)
      updates.available_from = body.available_from;

    if (body.bedrooms === null || typeof body.bedrooms === "number")
      updates.bedrooms = body.bedrooms;

    if (body.bathrooms === null || typeof body.bathrooms === "number")
      updates.bathrooms = body.bathrooms;

    if (body.square_feet === null || typeof body.square_feet === "number")
      updates.square_feet = body.square_feet;

    if (typeof body.type === "string") updates.type = body.type.trim() || null;

    if (typeof body.parking === "boolean") updates.parking = body.parking;

    if (body.parking_spots === null || typeof body.parking_spots === "number")
      updates.parking_spots = body.parking_spots;

    // 🟢 CLAVE: no-op PATCH permitido
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from("units")
      .update(updates)
      .eq("id", unitId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ PATCH UNIT ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
