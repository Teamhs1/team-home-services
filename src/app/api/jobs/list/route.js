import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("cleaning_jobs")
      .select(
        `
        id,
        title,
        service_type,
        scheduled_date,
        status,
        unit_type,
        features,
        duration_minutes,
        completed_at,
        created_at
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("💥 Error in /api/jobs/list:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
