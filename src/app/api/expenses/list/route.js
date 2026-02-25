import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    /* =========================
       🔹 GET PROFILE
    ========================== */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    /* =========================
       🔹 BASE QUERY
    ========================== */
    let baseQuery = supabase
      .from("expenses")
      .select(
        `
    id,
    description,
    amount,
    tax,
    final_cost,
    expense_date,
    invoice_url,
    property_id,
    contractor_id,
    contractor_name,
    created_at,
    property:properties (
      id,
      address
    ),
    unit:units (
      id,
      unit
    )
  `,
      )
      .order("created_at", { ascending: false });

    /* =========================
       👑 SUPER ADMIN
       Ve TODO el sistema
    ========================== */
    if (profile.role === "super_admin") {
      const { data, error } = await baseQuery;
      if (error) throw error;
      return NextResponse.json(data ?? []);
    }

    /* =========================
       🧑‍💼 ADMIN
       Ve todo pero SOLO de su company
    ========================== */
    if (profile.role === "admin") {
      if (!profile.active_company_id) {
        return NextResponse.json([]);
      }

      const { data: properties } = await supabase
        .from("properties")
        .select("id")
        .eq("company_id", profile.active_company_id);

      const propertyIds = properties?.map((p) => p.id) ?? [];

      if (propertyIds.length === 0) {
        return NextResponse.json([]);
      }

      const { data, error } = await baseQuery.in("property_id", propertyIds);

      if (error) throw error;
      return NextResponse.json(data ?? []);
    }

    /* =========================
       👷 STAFF
    ========================== */
    if (profile.role === "staff") {
      const { data: permission } = await supabase
        .from("staff_permissions")
        .select("can_view")
        .eq("staff_profile_id", profile.id)
        .eq("resource", "expenses")
        .single();

      if (!permission?.can_view) {
        return NextResponse.json([]);
      }

      if (!profile.active_company_id) {
        return NextResponse.json([]);
      }

      const { data: properties } = await supabase
        .from("properties")
        .select("id")
        .eq("company_id", profile.active_company_id);

      const propertyIds = properties?.map((p) => p.id) ?? [];

      if (propertyIds.length === 0) {
        return NextResponse.json([]);
      }

      const { data, error } = await baseQuery.in("property_id", propertyIds);

      if (error) throw error;
      return NextResponse.json(data ?? []);
    }

    /* =========================
       🏢 COMPANY MEMBERS
       (owner / manager / client)
    ========================== */
    const { data: companyMemberships } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("profile_id", profile.id);

    if (companyMemberships?.length) {
      const companyIds = companyMemberships.map((m) => m.company_id);

      const { data: properties } = await supabase
        .from("properties")
        .select("id")
        .in("company_id", companyIds);

      const propertyIds = properties?.map((p) => p.id) ?? [];

      if (propertyIds.length === 0) {
        return NextResponse.json([]);
      }

      const { data, error } = await baseQuery.in("property_id", propertyIds);

      if (error) throw error;
      return NextResponse.json(data ?? []);
    }

    return NextResponse.json([]);
  } catch (err) {
    console.error("EXPENSE LIST ERROR:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
