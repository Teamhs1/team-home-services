// /api/staff/jobs/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ SERVICE ROLE → sin RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { data, error } = await supabase
      .from("cleaning_jobs")
      .select(
        `
        id,
        title,
        status,
        service_type,
        scheduled_date,
        unit_type,
        features,
        duration_minutes,
        completed_at,
        assigned_to
      `,
      )
      .eq("assigned_to", userId)
      .order("scheduled_date", { ascending: true });

    if (error) {
      console.error("❌ Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ jobs: data || [] });
  } catch (err) {
    console.error("❌ API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
