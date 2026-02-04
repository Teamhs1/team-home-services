import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  const { jobId, minutes } = await req.json();

  if (!jobId || typeof minutes !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await supabase
    .from("cleaning_jobs")
    .update({ duration_minutes: minutes })
    .eq("id", jobId);

  return NextResponse.json({ success: true });
}
