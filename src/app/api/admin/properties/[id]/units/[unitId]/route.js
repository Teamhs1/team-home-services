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

    let query = supabase
      .from("units")
      .select(
        `
        *,
        property:property_id (
          id,
          address
        )
      `
      )
      .eq("id", unitId)
      .eq("property_id", property_id);

    if (profile.role !== "admin") {
      query = query.eq("property.company_id", profile.company_id);
    }

    const { data: unit, error } = await query.single();

    if (error || !unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
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
