import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ data: [] });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1️⃣ Load profile (CORRECT user)
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_company_id")
    .eq("clerk_id", userId)
    .single();

  if (!profile?.active_company_id) {
    return NextResponse.json({ data: [] });
  }

  // 2️⃣ Load properties of company
  const { data: properties } = await supabase
    .from("properties")
    .select("id")
    .eq("company_id", profile.active_company_id);

  if (!properties?.length) {
    return NextResponse.json({ data: [] });
  }

  const propertyIds = properties.map((p) => p.id);

  // 3️⃣ Load keys
  const { data: keys } = await supabase
    .from("keys")
    .select(
      `
      id,
      tag_code,
      unit,
      type,
      status,
      is_reported,
      properties (
        id,
        name,
        address
      )
    `
    )
    .in("property_id", propertyIds)
    .order("tag_code");

  return NextResponse.json({ data: keys || [] });
}
