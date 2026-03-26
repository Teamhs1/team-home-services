import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("leases")
      .select(
        `
        *,
        tenants (
          first_name,
          last_name,
          email
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("LEASES GET ERROR:", err.message);

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
