import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("job_id");

    if (!jobId)
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("job_activity_log")
      .select("id, job_id, staff_id, action, notes, created_at")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log(`📜 Found ${data.length} log entries for job ${jobId}`);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("💥 Error fetching job activity:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
