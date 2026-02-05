import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/*
  🔒 SERVICE ROLE
  - cierra el timer
  - completa el job
*/
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    /* =========================
       0️⃣ AUTH (COOKIE)
    ========================= */
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const jobId = body.job_id || body.jobId;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    /* =========================
       1️⃣ VALIDAR JOB
    ========================= */
    const { data: job, error: jobError } = await supabase
      .from("cleaning_jobs")
      .select("id, status")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 🔒 idempotencia
    if (job.status === "completed") {
      return NextResponse.json({ success: true, alreadyCompleted: true });
    }

    if (job.status !== "in_progress") {
      return NextResponse.json(
        { error: `Job cannot be stopped from status: ${job.status}` },
        { status: 400 },
      );
    }

    /* =========================
       2️⃣ OBTENER ÚLTIMO START
    ========================= */
    const { data: startData, error: startError } = await supabase
      .from("job_activity_log")
      .select("created_at")
      .eq("job_id", jobId)
      .eq("action", "start")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (startError || !startData) {
      return NextResponse.json(
        { error: "Job was never started" },
        { status: 400 },
      );
    }

    const startTime = new Date(startData.created_at);
    const endTime = new Date();

    const diffSeconds = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 1000,
    );

    const durationMinutes = Math.max(Math.floor(diffSeconds / 60), 1);

    /* =========================
       3️⃣ LOG STOP
    ========================= */
    const { error: stopLogError } = await supabase
      .from("job_activity_log")
      .insert({
        job_id: jobId,
        staff_id: userId, // 🔥 de Clerk, no del body
        action: "stop",
        duration_seconds: diffSeconds,
        notes: `Timer stopped after ${durationMinutes} min`,
        created_at: endTime.toISOString(),
      });

    if (stopLogError) {
      throw stopLogError;
    }

    /* =========================
       4️⃣ COMPLETAR JOB (FUENTE)
    ========================= */
    const { error: updateCleaningError } = await supabase
      .from("cleaning_jobs")
      .update({
        status: "completed",
        completed_at: endTime.toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq("id", jobId);

    if (updateCleaningError) {
      throw updateCleaningError;
    }

    /* =========================
       5️⃣ ACTUALIZAR jobs (UI)
    ========================= */
    await supabase
      .from("jobs")
      .update({
        status: "completed",
        completed_at: endTime.toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq("id", jobId);

    return NextResponse.json({
      success: true,
      status: "completed",
      durationSeconds: diffSeconds,
      durationMinutes,
    });
  } catch (err) {
    console.error("🛑 JOB STOP ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Failed to stop job" },
      { status: 500 },
    );
  }
}
