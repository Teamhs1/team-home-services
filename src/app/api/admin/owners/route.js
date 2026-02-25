import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =====================
   GET OWNERS (YA LO TENÍAS)
===================== */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("clerk_id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let query = supabase.from("owners").select("*");

  /* =========================
     SUPER ADMIN → ve todo
  ========================= */
  if (profile.role === "super_admin") {
    // no filter
  } else {
    /* =========================
       MULTI-TENANT VIA company_members
    ========================= */

    const { data: memberships, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("profile_id", profile.id);

    if (membershipError) {
      return NextResponse.json(
        { error: "Failed to load memberships" },
        { status: 500 },
      );
    }

    let companyIds = memberships?.map((m) => m.company_id) || [];

    if (companyIds.length === 0) {
      return NextResponse.json({ owners: [] });
    }

    /* =========================
       SERVICE PROVIDER SUPPORT
    ========================= */

    const { data: companies } = await supabase
      .from("companies")
      .select("id, company_type")
      .in("id", companyIds);

    const serviceProviders =
      companies?.filter((c) => c.company_type === "service_provider") || [];

    if (serviceProviders.length > 0) {
      const providerIds = serviceProviders.map((c) => c.id);

      const { data: managedCompanies } = await supabase
        .from("companies")
        .select("id")
        .in("service_provider_id", providerIds);

      const managedIds = managedCompanies?.map((c) => c.id) || [];

      companyIds = [...new Set([...companyIds, ...managedIds])];
    }

    query = query.in("company_id", companyIds);
  }

  const { data, error } = await query.order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ owners: data });
}
/* =====================
   CREATE OWNER (NUEVO)
===================== */
export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("clerk_id", userId)
    .single();

  if (
    !profile ||
    (profile.role !== "admin" && profile.role !== "super_admin")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { full_name, email } = body;

  if (!full_name) {
    return NextResponse.json(
      { error: "Full name is required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("owners")
    .insert({
      full_name,
      email: email || null,
      company_id: profile.company_id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ owner: data });
}
