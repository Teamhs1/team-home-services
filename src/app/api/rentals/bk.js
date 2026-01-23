// /app/api/rentals/route.js
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET() {
  const { data, error } = await supabase
    .from("units")
    .select(
      `
      id,
      unit,
      rent_price,
      available_from,
      availability_status,
      property:properties (
        id,
        address
      )
    `,
    )
    .eq("is_for_rent", true)
    .eq("availability_status", "available");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ units: data });
}
