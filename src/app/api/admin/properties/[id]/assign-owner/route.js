import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req, { params }) {
  try {
    const { userId } = await auth();
    const { id: propertyId } = params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!propertyId) {
      return NextResponse.json(
        { error: "Missing property id" },
        { status: 400 },
      );
    }

    const permissions = await getAllowedCompanyIds(userId);
    const { role, allowedCompanyIds } = permissions;

    if (!["admin", "super_admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { owner_id } = await req.json();

    if (!owner_id) {
      return NextResponse.json(
        { error: "owner_id is required" },
        { status: 400 },
      );
    }

    /* =========================
       VALIDATE PROPERTY
    ========================= */

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("company_id")
      .eq("id", propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    if (
      role !== "super_admin" &&
      !allowedCompanyIds.includes(property.company_id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* =========================
       VALIDATE OWNER (must belong to same company)
    ========================= */

    const { data: owner, error: ownerError } = await supabase
      .from("profiles")
      .select("id, active_company_id")
      .eq("id", owner_id)
      .single();

    if (ownerError || !owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    if (
      role !== "super_admin" &&
      !allowedCompanyIds.includes(owner.active_company_id)
    ) {
      return NextResponse.json(
        { error: "Owner not authorized for this company" },
        { status: 403 },
      );
    }

    /* =========================
       ASSIGN OWNER
    ========================= */

    const { error: updateError } = await supabase
      .from("properties")
      .update({ owner_id })
      .eq("id", propertyId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ ASSIGN OWNER ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to assign owner" },
      { status: 500 },
    );
  }
}
