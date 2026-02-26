import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =========================
   CREATE INVOICE (POST)
========================= */
export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      property_id,
      unit_id,
      job_id,
      type = "manual",
      amount_cents,
      due_date,
      notes,
    } = body;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    if (!property_id) {
      return NextResponse.json(
        { error: "Property is required" },
        { status: 400 },
      );
    }

    // 🔥 Obtener company REAL desde property
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("company_id")
      .eq("id", property_id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: "Invalid property" }, { status: 400 });
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        company_id: property.company_id,
        property_id,
        unit_id,
        job_id,
        type,
        amount_cents,
        currency: "cad",
        status: "draft",
        due_date,
        notes,
        created_by: profile.id,
      })
      .select()
      .single();

    if (invoiceError) {
      return NextResponse.json(
        { error: invoiceError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ invoice });
  } catch (err) {
    console.error("Create invoice error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/* =========================
   LIST INVOICES (GET)
========================= */
export async function GET() {
  try {
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
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    let query = supabase
      .from("invoices")
      .select(
        `
        id,
        type,
        amount_cents,
        status,
        due_date,
        created_at,
        notes,
        company_id,
        properties ( id, address ),
        units ( id, unit ),
        creator:profiles ( id, full_name, email )
      `,
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    /* =========================
       👑 SUPER ADMIN
    ========================= */
    if (profile.role === "super_admin") {
      // ve todo
    } else {
      /* =========================
         🔐 Obtener companies desde company_members
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
        return NextResponse.json({ invoices: [] });
      }

      /* =========================
         🏗 SERVICE PROVIDER LOGIC
      ========================= */

      // Buscar si alguna de sus companies es service_provider
      const { data: companies } = await supabase
        .from("companies")
        .select("id, company_type")
        .in("id", companyIds);

      const serviceProviderCompanies =
        companies?.filter((c) => c.company_type === "service_provider") || [];

      if (serviceProviderCompanies.length > 0) {
        const providerIds = serviceProviderCompanies.map((c) => c.id);

        const { data: managedCompanies } = await supabase
          .from("companies")
          .select("id")
          .in("service_provider_id", providerIds);

        const managedIds = managedCompanies?.map((c) => c.id) || [];

        companyIds = [...new Set([...companyIds, ...managedIds])];
      }

      query = query.in("company_id", companyIds);
    }

    const { data: invoices, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to load invoices" },
        { status: 500 },
      );
    }

    return NextResponse.json({ invoices });
  } catch (err) {
    console.error("List invoices error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
