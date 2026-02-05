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

  const { data: job, error } = await supabase
    .from("cleaning_jobs")
    .select("started_at")
    .eq("id", jobId)
    .single();

  if (error || !job?.started_at) {
    return NextResponse.json(
      { error: "Job has no start time" },
      { status: 400 },
    );
  }

  const completedAt = new Date();
  const durationMinutes = Math.round(
    (completedAt.getTime() - new Date(job.started_at).getTime()) / 60000,
  );

  await supabase
    .from("cleaning_jobs")
    .update({
      status: "completed",
      completed_at: completedAt.toISOString(),
      duration_minutes: durationMinutes,
    })
    .eq("id", jobId);

  return NextResponse.json({
    success: true,
    duration_minutes: durationMinutes,
  });
}
