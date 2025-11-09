import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const job_id = searchParams.get("job_id");

    if (!job_id) {
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 🔹 Buscar el último registro de tipo "stop"
    const { data, error } = await supabase
      .from("job_activity_log")
      .select("duration_seconds, created_at")
      .eq("job_id", job_id)
      .eq("action", "stop")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data)
      return NextResponse.json({ duration: null, message: "No stop found" });

    return NextResponse.json({
      duration: data.duration_seconds,
      message: "Duration found",
    });
  } catch (err) {
    console.error("💥 Error fetching duration:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
