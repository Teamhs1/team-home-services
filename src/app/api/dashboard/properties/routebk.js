import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getProfileByClerkId } from "@/lib/permissions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfileByClerkId(userId);
    if (!profile) {
      return NextResponse.json({ data: [] });
    }

    // ✅ CLIENT y STAFF dependen SOLO de active_company_id
    const companyId = profile.active_company_id;
    if (!companyId) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
      .from("properties")
      .select(
        `
        id,
        name,
        address,
        unit,
        created_at,
        company_id,
        owner_id,
        owners:owner_id (
          id,
          full_name
        ),
        companies:company_id (
          id,
          name
        )
      `
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("DB ERROR:", error);
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error("💥 API ERROR:", err);
    return NextResponse.json({ data: [] });
  }
}
