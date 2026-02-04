import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { job_id, staff_id } = await req.json();

    if (!job_id) {
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 1️⃣ Buscar último START
    const { data: startData, error: startError } = await supabase
      .from("job_activity_log")
      .select("created_at")
      .eq("job_id", job_id)
      .eq("action", "start")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (startError) throw startError;

    if (!startData) {
      return NextResponse.json(
        { error: "No start record found for this job" },
        { status: 404 },
      );
    }

    // 2️⃣ Calcular duración
    const startTime = new Date(startData.created_at);
    const endTime = new Date();
    const diffSeconds = Math.floor((endTime - startTime) / 1000);
    const durationMinutes = Math.max(Math.floor(diffSeconds / 60), 1);

    // 3️⃣ Registrar STOP (SOLO LOG)
    await supabase.from("job_activity_log").insert({
      job_id,
      staff_id,
      action: "stop",
      notes: `Timer stopped after ${durationMinutes} min`,
      duration_seconds: diffSeconds,
      created_at: endTime.toISOString(),
    });

    return NextResponse.json({
      message: "Timer stopped",
      durationMinutes,
    });
  } catch (err) {
    console.error("💥 Job stop error:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected error stopping job" },
      { status: 500 },
    );
  }
}
