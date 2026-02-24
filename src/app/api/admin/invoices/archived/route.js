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
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !["admin", "super_admin"].includes(profile?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(
        `
        id,
        type,
        amount_cents,
        deleted_at,
        properties (
          address
        )
      `,
      )
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invoices });
  } catch (err) {
    console.error("Archived invoices error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
