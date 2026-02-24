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
      .select("id, active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        company_id: profile.active_company_id,
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
      .select("role, active_company_id")
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
        properties (
          id,
          address
        ),
        units (
          id,
          unit
        ),
        creator:profiles (
          id,
          full_name,
          email
        )
      `,
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    /* =========================
       👑 SUPER ADMIN → ve todo
    ========================= */

    if (profile.role === "super_admin") {
      // no filter
    } else {

    /* =========================
       🏗 SERVICE PROVIDER LOGIC
    ========================= */
      if (!profile.active_company_id) {
        return NextResponse.json(
          { error: "No active company" },
          { status: 403 },
        );
      }

      // Obtener company actual
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, company_type")
        .eq("id", profile.active_company_id)
        .single();

      if (companyError || !company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 },
        );
      }

      let allowedCompanyIds = [company.id];

      if (company.company_type === "service_provider") {
        const { data: managedCompanies } = await supabase
          .from("companies")
          .select("id")
          .eq("service_provider_id", company.id);

        const managedIds = managedCompanies?.map((c) => c.id) || [];

        allowedCompanyIds = [company.id, ...managedIds];
      }

      query = query.in("company_id", allowedCompanyIds);
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
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
