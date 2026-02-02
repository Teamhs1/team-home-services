import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(req, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing rental id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("units")
    .select(
      `
  id,
  unit,
  bedrooms,
  bathrooms,
  square_feet,
  rent_price,
  parking,
  parking_spots,
  available_from,
  description,
  images,
  property:properties (
    address,
    postal_code,
    latitude,
    longitude
  )
`,
    )

    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("❌ Rental API error:", error);
    return NextResponse.json(
      { error: "Failed to load rental" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Rental not found" }, { status: 404 });
  }

  // 🔥 NORMALIZAR PARKING
  const unit = {
    ...data,
    parking: Boolean(data.parking),
    parking_spots: data.parking_spots ?? null,
  };

  return NextResponse.json({ unit });
}
