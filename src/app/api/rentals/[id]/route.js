import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(req, { params }) {
  const { id } = params;

  const { data, error } = await supabase
    .from("units")
    .select(
      `
      id,
      unit,
      bedrooms,
      bathrooms,
      square_feet,
      type,
      parking,
      rent_price,
      available_from,
      description,
      availability_status,
      is_for_rent,
      images,
      property:properties (
        id,
        address,
        postal_code,
        year_built
      )
    `,
    )
    .eq("id", id)
    .eq("is_for_rent", true)
    .maybeSingle();

  if (error) {
    console.error("Rental API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Rental not found" }, { status: 404 });
  }

  return NextResponse.json({ unit: data });
}
