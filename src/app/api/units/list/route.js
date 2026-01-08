import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("property_id");

  if (!propertyId) {
    return NextResponse.json({ error: "Missing property_id" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from("units")
    .select("id, unit")
    .eq("property_id", propertyId)
    .order("unit");

  if (error) {
    console.error("UNITS API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load units" },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}
