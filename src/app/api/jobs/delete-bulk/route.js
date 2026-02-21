// app/api/jobs/delete-bulk/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No job IDs provided" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    /* =========================
       1️⃣ Get photo paths
    ========================= */
    const { data: photos } = await supabase
      .from("job_photos")
      .select("image_url")
      .in("job_id", ids);

    const filePaths = photos?.map((p) => p.image_url).filter(Boolean) || [];

    /* =========================
       2️⃣ Delete from Storage
    ========================= */
    if (filePaths.length > 0) {
      await supabase.storage.from("job_photos").remove(filePaths);
    }

    /* =========================
       3️⃣ Delete photo rows
    ========================= */
    await supabase.from("job_photos").delete().in("job_id", ids);

    /* =========================
       4️⃣ Delete jobs
    ========================= */
    const { data, error } = await supabase
      .from("cleaning_jobs")
      .delete()
      .in("id", ids)
      .select("id");

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: data.length,
      deletedIds: data.map((d) => d.id),
    });
  } catch (err) {
    console.error("❌ BULK DELETE ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete jobs" },
      { status: 500 },
    );
  }
}
