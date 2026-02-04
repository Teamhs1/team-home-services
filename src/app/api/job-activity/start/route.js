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

  const { data: job } = await supabase
    .from("cleaning_jobs")
    .select("status")
    .eq("id", jobId)
    .single();

  if (job?.status !== "pending") {
    return NextResponse.json({ error: "Job already started" }, { status: 400 });
  }

  await supabase.from("job_activity_log").insert({
    job_id: jobId,
    action: "start",
    created_by: userId,
  });

  await supabase
    .from("cleaning_jobs")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  return NextResponse.json({ success: true });
}
