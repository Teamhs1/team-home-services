import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getProfileByClerkId } from "@/lib/permissions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req, { params }) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfileByClerkId(userId);
    if (!profile?.active_company_id) {
      return NextResponse.json({ error: "No active company" }, { status: 403 });
    }

    const { id } = params;

    // 🔒 Property (solo de su company)
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select(
        `
        *,
        companies:company_id (
          id,
          name
        )
      `
      )
      .eq("id", id)
      .eq("company_id", profile.active_company_id)
      .single();

    if (propError || !property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Units
    const { data: units } = await supabase
      .from("units")
      .select("*")
      .eq("property_id", id);

    // Keys
    const { data: keys } = await supabase
      .from("keys")
      .select("*")
      .eq("property_id", id);

    return NextResponse.json({
      property,
      units: units || [],
      keys: keys || [],
    });
  } catch (err) {
    console.error("💥 API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
