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

    const { data: profile } = await supabase
      .from("profiles")
      .select("active_company_id")
      .eq("clerk_id", userId)
      .single();

    const { data: properties, error } = await supabase
      .from("properties")
      .select("id, address")
      .eq("company_id", profile.active_company_id)
      .order("address");

    if (error) throw error;

    return NextResponse.json({ properties });
  } catch (err) {
    console.error("Load properties error:", err);
    return NextResponse.json(
      { error: "Failed to load properties" },
      { status: 500 },
    );
  }
}
