// /api/jobs/assign-client/route.js
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { jobId, clientProfileId } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  if (clientProfileId && clientProfileId.startsWith("user_")) {
    return NextResponse.json(
      { error: "clientProfileId must be a UUID, not a clerk_id" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("cleaning_jobs")
    .update({
      client_profile_id: clientProfileId || null,
    })
    .eq("id", jobId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
