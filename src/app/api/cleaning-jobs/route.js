import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function GET(req, { params }) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // 👈 importante
  );

  const { data, error } = await supabase
    .from("cleaning_jobs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    title: data.title || data.address || "Cleaning Job",
    status: data.status,
    unit_type: data.unit_type,
    features: data.features || [],
    started_at: data.started_at,
    completed_at: data.completed_at,
    duration_minutes: data.duration_minutes,
    assigned_to: data.assigned_to,
    created_at: data.created_at,
  });
}
