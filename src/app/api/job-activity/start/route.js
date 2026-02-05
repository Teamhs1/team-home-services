import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  const { userId } = getAuth(req); // 🔥 CLAVE

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await req.json();

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
  if (job.status === "in_progress") {
    return NextResponse.json({ success: true, alreadyStarted: true });
  }

  if (job.status !== "pending") {
    return NextResponse.json(
      { error: `Job cannot be started from status: ${job.status}` },
      { status: 400 },
    );
  }

  const startedAt = new Date().toISOString();

  /* =========================
     2️⃣ LOG START
  ========================= */
  const { error: logError } = await supabase.from("job_activity_log").insert({
    job_id: jobId,
    action: "start",
    staff_id: userId,
    created_at: startedAt,
  });

  if (logError) {
    console.error("❌ job_activity_log error:", logError);
    return NextResponse.json(
      { error: "Failed to log job start" },
      { status: 500 },
    );
  }

  /* =========================
     3️⃣ UPDATE cleaning_jobs (source of truth)
  ========================= */
  const { error: updateCleaningError } = await supabase
    .from("cleaning_jobs")
    .update({
      status: "in_progress",
      started_at: startedAt,
    })
    .eq("id", jobId);

  if (updateCleaningError) {
    console.error("❌ cleaning_jobs update error:", updateCleaningError);
    return NextResponse.json(
      { error: "Failed to update cleaning job" },
      { status: 500 },
    );
  }

  /* =========================
     4️⃣ UPDATE jobs (UI mirror)
  ========================= */
  const { error: updateJobsError } = await supabase
    .from("jobs")
    .update({
      status: "in_progress",
      started_at: startedAt,
    })
    .eq("id", jobId);

  if (updateJobsError) {
    console.error("⚠️ jobs mirror update error:", updateJobsError);
    // no rompemos todo por esto
  }

  return NextResponse.json({
    success: true,
    started_at: startedAt,
  });
}
