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
      parking_spots,
      available_from,
      description,
      images,
      property:properties (
        address,
        postal_code,
        latitude,
        longitude,
        year_built
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

  /**
   * 🔥 NORMALIZACIÓN CORRECTA
   * - parking se deriva de parking_spots
   * - parking_spots es la fuente real
   */
  const unit = {
    ...data,
    parking: typeof data.parking_spots === "number" && data.parking_spots > 0,
    parking_spots:
      typeof data.parking_spots === "number" ? data.parking_spots : null,
  };

  return NextResponse.json({ unit });
}
