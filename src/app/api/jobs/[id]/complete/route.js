import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req, { params }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobId = params.id;

  // 🔒 Validar estado y obtener start
  const { data: job, error } = await supabase
    .from("cleaning_jobs")
    .select("status, started_at")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "in_progress") {
    return NextResponse.json(
      { error: "Job is not in progress" },
      { status: 400 },
    );
  }

  if (!job.started_at) {
    return NextResponse.json(
      { error: "Job has no start time" },
      { status: 400 },
    );
  }

  // ⏱️ CALCULAR DURACIÓN
  const endedAt = new Date();
  const durationMinutes = Math.round(
    (endedAt - new Date(job.started_at)) / 60000,
  );

  // ✅ COMPLETAR JOB + GUARDAR DURACIÓN
  await supabase
    .from("cleaning_jobs")
    .update({
      status: "completed",
      completed_at: endedAt.toISOString(),
      duration_minutes: durationMinutes,
    })
    .eq("id", jobId);

  return NextResponse.json({
    success: true,
    duration_minutes: durationMinutes,
  });
}
