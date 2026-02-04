import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const job_id = searchParams.get("job_id");

    if (!job_id) {
      return NextResponse.json({ duration: null });
    }

    // ✅ USA PUBLIC KEY (NO SERVICE ROLE)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );

    // 0️⃣ override manual
    const { data: job } = await supabase
      .from("cleaning_jobs")
      .select("duration_override_minutes, started_at, completed_at")
      .eq("id", job_id)
      .maybeSingle();

    if (job?.duration_override_minutes != null) {
      return NextResponse.json({
        duration: job.duration_override_minutes * 60,
        source: "override",
      });
    }

    // 1️⃣ activity log
    const { data: stop } = await supabase
      .from("job_activity_log")
      .select("duration_seconds")
      .eq("job_id", job_id)
      .eq("action", "stop")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (stop?.duration_seconds) {
      return NextResponse.json({
        duration: stop.duration_seconds,
        source: "activity",
      });
    }

    // 2️⃣ fallback
    if (!job?.started_at || !job?.completed_at) {
      return NextResponse.json({ duration: null });
    }

    const duration = Math.floor(
      (new Date(job.completed_at) - new Date(job.started_at)) / 1000,
    );

    return NextResponse.json({
      duration,
      source: "auto",
    });
  } catch (err) {
    console.error("last-duration error:", err);
    return NextResponse.json({ duration: null });
  }
}
