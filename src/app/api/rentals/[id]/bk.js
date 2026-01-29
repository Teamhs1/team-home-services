import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // 👈 IMPORTANTE
);

export async function GET(req, { params }) {
  const { id } = params;

  const { data, error } = await supabase
    .from("units")
    .select(
      `
      id,
      unit,
      rent_price,
      availability_status,
      property:properties (
        id,
        address
      )
    `,
    )
    .eq("id", id)
    .eq("is_for_rent", true)
    .single(); // 👈 CLAVE

  if (error || !data) {
    return NextResponse.json({ error: "Rental not found" }, { status: 404 });
  }

  return NextResponse.json({ unit: data });
}
