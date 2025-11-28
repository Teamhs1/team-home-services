import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* ============================================================
   POST — SAVE / UPDATE UNIT_TYPE + FEATURES
   ============================================================ */
export async function POST(req) {
  try {
    const { job_id, unit_type, features } = await req.json();

    if (!job_id) {
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
    }

    // Build update object dynamically
    const updateData = {};
    if (unit_type) updateData.unit_type = unit_type;
    if (Array.isArray(features)) updateData.features = features;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { error } = await supabase
      .from("cleaning_jobs")
      .update(updateData)
      .eq("id", job_id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      updated: updateData,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============================================================
   GET — RETURN unit_type + features ALWAYS inside data:{ }
   ============================================================ */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const job_id = searchParams.get("job_id");

    if (!job_id) {
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("cleaning_jobs")
      .select("unit_type, features")
      .eq("id", job_id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: {
        unit_type: data?.unit_type || null,
        features: data?.features || [],
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
