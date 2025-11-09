import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const body = await req.json();
    const { job_id, staff_id, action, notes } = body;

    if (!job_id || !action) {
      return NextResponse.json(
        { error: "Missing job_id or action" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("job_activity_log")
      .insert([{ job_id, staff_id, action, notes }])
      .select();

    if (error) throw error;

    console.log("✅ Job activity logged:", data);
    return NextResponse.json({ message: "Activity recorded", data });
  } catch (err) {
    console.error("💥 Job activity error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
