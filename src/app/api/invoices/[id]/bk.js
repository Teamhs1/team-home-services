import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(req, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // 👑 Admin global desde Clerk
    const isAdmin = sessionClaims?.publicMetadata?.role === "admin";

    // 🔎 Buscar profile SOLO para company_id (si no es admin)
    let companyId = null;

    if (!isAdmin) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("active_company_id")
        .eq("clerk_id", userId)
        .single();

      if (profileError || !profile?.active_company_id) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 403 },
        );
      }

      companyId = profile.active_company_id;
    }

    // 🧾 Base query
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

    // 🔐 SOLO filtrar por company si NO es admin
    if (!isAdmin) {
      query = query.eq("company_id", companyId);
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
