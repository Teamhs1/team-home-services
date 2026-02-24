import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(req, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    let permissions;

    try {
      permissions = await getAllowedCompanyIds(userId);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    /* =========================
       👑 SUPER ADMIN → acceso total
    ========================= */

    if (permissions.role === "super_admin") {
      const { data: invoice, error } = await supabase
        .from("invoices")
        .select(
          `
          id,
          type,
          amount_cents,
          status,
          notes,
          deleted_at,
          company_id,
          created_at,
          properties ( address ),
          units ( unit )
        `,
        )
        .eq("id", id)
        .single();

      if (error || !invoice) {
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ invoice });
    }

    /* =========================
       🔐 Acceso filtrado por company
    ========================= */

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(
        `
        id,
        type,
        amount_cents,
        status,
        notes,
        deleted_at,
        company_id,
        created_at,
        properties ( address ),
        units ( unit )
      `,
      )
      .eq("id", id)
      .in("company_id", permissions.allowedCompanyIds)
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found or not authorized" },
        { status: 404 },
      );
    }

    return NextResponse.json({ invoice });
  } catch (err) {
    console.error("Invoice GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
