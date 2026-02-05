import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await req.json();
  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  // 1️⃣ Validar estado actual (cleaning_jobs = fuente de verdad)
  const { data: job, error } = await supabase
    .from("cleaning_jobs")
    .select("status")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "pending") {
    return NextResponse.json({ error: "Job already started" }, { status: 400 });
  }

  const startedAt = new Date().toISOString();

  // 2️⃣ Log de actividad
  await supabase.from("job_activity_log").insert({
    job_id: jobId,
    action: "start",
    created_by: userId,
  });

  // 3️⃣ Actualizar cleaning_jobs (FUENTE)
  await supabase
    .from("cleaning_jobs")
    .update({
      status: "in_progress",
      started_at: startedAt,
    })
    .eq("id", jobId);

  // 4️⃣ 🔥 Actualizar jobs (ESPEJO UI)
  await supabase
    .from("jobs")
    .update({
      status: "in_progress",
      started_at: startedAt,
    })
    .eq("id", jobId);

  return NextResponse.json({ success: true });
}
