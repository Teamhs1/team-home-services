import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, address, unit, street_number, street_name, company_id } =
      body;

    if (!name || !address || !company_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let permissions;

    try {
      permissions = await getAllowedCompanyIds(userId);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    /* =====================
       VALIDATE ROLE
    ===================== */

    if (!["admin", "super_admin"].includes(permissions.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* =====================
       VALIDATE COMPANY ACCESS
    ===================== */

    if (
      permissions.role !== "super_admin" &&
      !permissions.allowedCompanyIds.includes(company_id)
    ) {
      return NextResponse.json(
        { error: "Not authorized to create property for this company" },
        { status: 403 },
      );
    }

    /* =====================
       CHECK DUPLICATE
    ===================== */

    let duplicateQuery = supabase
      .from("properties")
      .select("id")
      .eq("company_id", company_id)
      .eq("address", address);

    if (unit) {
      duplicateQuery = duplicateQuery.eq("unit", unit);
    }

    const { data: existing } = await duplicateQuery.maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error:
            "A property with this address already exists for this company.",
        },
        { status: 409 },
      );
    }

    /* =====================
       CREATE PROPERTY
    ===================== */

    const { data, error } = await supabase
      .from("properties")
      .insert({
        name,
        address,
        unit,
        street_number,
        street_name,
        company_id,
        owner_id: null,
      })
      .select()
      .single();

    if (error) {
      console.error("CREATE PROPERTY ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("CREATE PROPERTY FATAL:", err);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 },
    );
  }
}
