import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // backend seguro
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

    // 1️⃣ Buscar profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // 2️⃣ Insert invoice
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
      console.error(invoiceError);
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

    // 1️⃣ Buscar profile + role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // 2️⃣ Base query
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
        properties (
          id,
          address
        ),
        units (
          id,
          unit
        )
      `,
      )
      .order("created_at", { ascending: false });

    // 3️⃣ SOLO filtrar por company si NO es admin
    if (profile.role !== "admin") {
      query = query.eq("company_id", profile.active_company_id);
    }

    const { data: invoices, error } = await query;

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to load invoices" },
        { status: 500 },
      );
    }

    return NextResponse.json({ invoices });
  } catch (err) {
    console.error("Get invoices error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
