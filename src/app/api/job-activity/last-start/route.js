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

    // 🕐 Buscar el último registro de inicio (start)
    const { data, error } = await supabase
      .from("job_activity_log")
      .select("created_at")
      .eq("job_id", jobId)
      .eq("action", "start")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error; // 116 = no rows
    return NextResponse.json({ startTime: data?.created_at || null });
  } catch (err) {
    console.error("💥 Error getting start time:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
