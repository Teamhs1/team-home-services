import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   GET PROPERTY (ADMIN / CLIENT)
========================= */
export async function GET(req, { params }) {
  try {
    const { userId } = await auth();
    const { id: propertyId } = params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    let query = supabase
      .from("properties")
      .select(
        `
        id,
        name,
        address,
        postal_code,
        latitude,
        longitude,
        year_built,
        company_id,
        company:company_id (
          id,
          name
        )
      `
      )
      .eq("id", propertyId);

    // 🔐 Client admin → limitado a su company
    if (profile.role === "client") {
      query = query.eq("company_id", profile.active_company_id);
    }

    const { data: property, error } = await query.single();

    if (error || !property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const { data: units } = await supabase
      .from("units")
      .select("*")
      .eq("property_id", propertyId)
      .order("unit");

    const { data: keys } = await supabase
      .from("keys")
      .select("*")
      .eq("property_id", propertyId)
      .order("tag_code");

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
   PATCH PROPERTY (ADMIN + CLIENT ADMIN)
========================= */
export async function PATCH(req, { params }) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // 🔎 obtener company de la propiedad
    const { data: property } = await supabase
      .from("properties")
      .select("company_id")
      .eq("id", propertyId)
      .single();

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // 🔐 seguridad REAL
    if (
      profile.role !== "admin" &&
      property.company_id !== profile.active_company_id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updates = {};

    if (typeof body.latitude === "number") updates.latitude = body.latitude;
    if (typeof body.longitude === "number") updates.longitude = body.longitude;

    if (typeof body.postal_code === "string") {
      updates.postal_code =
        body.postal_code.trim() === "" ? null : body.postal_code.trim();
    }

    if (body.year_built === null || typeof body.year_built === "number") {
      updates.year_built = body.year_built;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from("properties")
      .update(updates)
      .eq("id", propertyId);

    if (error) throw error;

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
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await supabase.from("properties").delete().eq("id", propertyId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE PROPERTY ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
