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
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // 🔐 Load profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("clerk_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ data: [] });
  }

  let propertyIds = [];

  // 👑 SUPER ADMIN → ve todo
  if (profile.role === "super_admin") {
    const { data: allProperties } = await supabase
      .from("properties")
      .select("id");

    propertyIds = allProperties?.map((p) => p.id) || [];
  }

  // 🔐 ADMIN → solo sus companies
  else {
    const { data: memberships } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("profile_id", profile.id);

    const companyIds = memberships?.map((m) => m.company_id) || [];

    const { data: properties } = await supabase
      .from("properties")
      .select("id")
      .in("company_id", companyIds);

    propertyIds = properties?.map((p) => p.id) || [];
  }

  if (!propertyIds.length) {
    return NextResponse.json({ data: [] });
  }

  // 🔑 Load keys
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
  property_id,
  properties:property_id (
    id,
    name,
    address,
    company_id,
    companies:company_id (
      id,
      name
    )
  )
`,
    )
    .in("property_id", propertyIds)
    .order("tag_code");

  return NextResponse.json({ data: keys || [] });
}
