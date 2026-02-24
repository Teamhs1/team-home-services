import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =========================
   GET PROPERTY
========================= */
export async function GET(req, { params }) {
  try {
    const { userId } = await auth();
    const { id: propertyId } = params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getAllowedCompanyIds(userId);
    const { role, allowedCompanyIds } = permissions;

    let query = supabase
      .from("properties")
      .select(
        `
        id,
        name,
        address,
        postal_code,
        description,
        latitude,
        longitude,
        year_built,
        owner_id,
        owner:owner_id (
          id,
          full_name,
          email
        ),
        company_id,
        company:company_id (
          id,
          name
        )
      `,
      )
      .eq("id", propertyId);

    // 🔐 Non-super-admin → restringir por company
    if (role !== "super_admin") {
      query = query.in("company_id", allowedCompanyIds);
    }

    const { data: property, error } = await query.single();

    if (error || !property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    // 🔐 Units filtradas también
    const { data: units } = await supabase
      .from("units")
      .select("*")
      .eq("property_id", propertyId)
      .in("company_id", allowedCompanyIds);

    const { data: keys } = await supabase
      .from("keys")
      .select("*")
      .eq("property_id", propertyId)
      .in("company_id", allowedCompanyIds);

    return NextResponse.json({
      property,
      units: units || [],
      keys: keys || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to load property" },
      { status: 500 },
    );
  }
}

/* =========================
   PATCH PROPERTY (ADMIN / SUPER ADMIN)
========================= */
export async function PATCH(req, { params }) {
  try {
    const { userId } = await auth();
    const { id: propertyId } = params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getAllowedCompanyIds(userId);
    const { role, allowedCompanyIds } = permissions;

    if (!["admin", "super_admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🔐 Validar que property pertenezca a company permitida
    const { data: existingProperty } = await supabase
      .from("properties")
      .select("company_id")
      .eq("id", propertyId)
      .single();

    if (!existingProperty) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    if (
      role !== "super_admin" &&
      !allowedCompanyIds.includes(existingProperty.company_id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updates = {};

    if (typeof body.description === "string")
      updates.description = body.description.trim();

    if (typeof body.name === "string") updates.name = body.name.trim();

    if (typeof body.address === "string") updates.address = body.address.trim();

    if (typeof body.latitude === "number") updates.latitude = body.latitude;

    if (typeof body.longitude === "number") updates.longitude = body.longitude;

    if (typeof body.postal_code === "string")
      updates.postal_code =
        body.postal_code.trim() === "" ? null : body.postal_code;

    if (body.year_built === null || typeof body.year_built === "number")
      updates.year_built = body.year_built;

    if (body.owner_id === null || typeof body.owner_id === "string")
      updates.owner_id = body.owner_id;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("properties")
      .update(updates)
      .eq("id", propertyId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ property: data });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to update property" },
      { status: 500 },
    );
  }
}

/* =========================
   DELETE PROPERTY
========================= */
export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth();
    const { id: propertyId } = params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getAllowedCompanyIds(userId);
    const { role, allowedCompanyIds } = permissions;

    if (!["admin", "super_admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (role !== "super_admin") {
      const { data: existingProperty } = await supabase
        .from("properties")
        .select("company_id")
        .eq("id", propertyId)
        .single();

      if (
        !existingProperty ||
        !allowedCompanyIds.includes(existingProperty.company_id)
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to delete property" },
      { status: 500 },
    );
  }
}
