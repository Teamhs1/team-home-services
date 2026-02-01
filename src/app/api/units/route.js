import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get("property_id");

    if (!property_id) {
      return NextResponse.json({ units: [] });
    }

    const { data: units, error } = await supabase
      .from("units")
      .select("id, unit")
      .eq("property_id", property_id)
      .order("unit");

    if (error) throw error;

    return NextResponse.json({ units });
  } catch (err) {
    console.error("Load units error:", err);
    return NextResponse.json(
      { error: "Failed to load units" },
      { status: 500 },
    );
  }
}
