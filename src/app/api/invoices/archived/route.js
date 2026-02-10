import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

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

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("invoices")
      .select(
        `
        id,
        type,
        amount_cents,
        status,
        notes,
        deleted_at,
        properties (
          address
        )
      `,
      )
      .eq("company_id", profile.active_company_id)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ invoices: data });
  } catch (err) {
    console.error("Archived invoices error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
