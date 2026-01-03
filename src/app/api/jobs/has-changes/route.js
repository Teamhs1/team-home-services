// /api/jobs/has-changes/route.js
import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");

  if (!since) {
    return NextResponse.json({ hasChanges: true });
  }

  const { data, error } = await supabaseServer
    .from("cleaning_jobs")
    .select("id")
    .gt("updated_at", since)
    .limit(1);

  if (error) {
    return NextResponse.json({ hasChanges: false });
  }

  return NextResponse.json({ hasChanges: data.length > 0 });
}
