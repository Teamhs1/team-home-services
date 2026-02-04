import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// =========================
// GET → cálculo automático
// =========================
export async function GET(req, { params }) {
  const { data, error } = await supabase
    .from("cleaning_jobs")
    .select("started_at, completed_at")
    .eq("id", params.id)
    .single();

  if (error || !data?.started_at || !data?.completed_at) {
    return NextResponse.json({ duration: null });
  }

  const durationSeconds = Math.floor(
    (new Date(data.completed_at) - new Date(data.started_at)) / 1000,
  );

  return NextResponse.json({ duration: durationSeconds });
}

// =========================
// PATCH → edición manual
// =========================
export async function PATCH(req, { params }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { duration_minutes } = await req.json();

  if (typeof duration_minutes !== "number" || duration_minutes < 0) {
    return NextResponse.json(
      { error: "Invalid duration_minutes" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("cleaning_jobs")
    .update({
      duration_minutes,
      status: "completed",
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
