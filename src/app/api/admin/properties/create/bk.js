import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, address, unit, street_number, street_name, company_id } = body;

  if (!name || !address || !company_id) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  /* =====================
     VALIDATE ADMIN
  ===================== */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("clerk_id", userId)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  /* =====================
     🔎 CHECK DUPLICATE PROPERTY
     SAME COMPANY + SAME ADDRESS (+ UNIT)
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
        error: "A property with this address already exists for this company.",
      },
      { status: 409 } // 👈 Conflict
    );
  }

  /* =====================
     FIND OWNER (OPTIONAL)
  ===================== */
  const { data: owner } = await supabase
    .from("owners")
    .select("id")
    .eq("company_id", company_id)
    .maybeSingle();

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
      owner_id: owner?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("CREATE PROPERTY ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
