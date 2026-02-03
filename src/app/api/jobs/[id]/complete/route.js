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

  // 🔒 Solo se puede completar si está en progreso
  const { data: job } = await supabase
    .from("cleaning_jobs")
    .select("status, started_at")
    .eq("id", jobId)
    .single();

  if (job.status !== "in_progress") {
    return NextResponse.json(
      { error: "Job is not in progress" },
      { status: 400 },
    );
  }

  await supabase
    .from("cleaning_jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  return NextResponse.json({ success: true });
}
