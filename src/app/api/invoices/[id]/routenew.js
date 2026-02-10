import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =========================
   GET INVOICE
========================= */
export async function GET(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    const isAdmin = profile.role === "admin";

    let query = supabase
      .from("invoices")
      .select(
        `
        id,
        type,
        amount_cents,
        status,
        notes,
        due_date,
        created_at,
        property_id,
        unit_id,
        company_id, -- 👈 importante para validación
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
      .eq("id", id);

    if (!isAdmin) {
      query = query.eq("company_id", profile.active_company_id);
    }

    const { data: invoice, error } = await query.single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (err) {
    console.error("Get invoice error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/* =========================
   DELETE INVOICE
========================= */
export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    if (profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete invoice error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
