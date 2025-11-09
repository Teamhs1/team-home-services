import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 🚀 Eliminar Job (sin JWT ni Clerk)
 */
export async function POST(req) {
  try {
    console.log("🟢 /api/jobs/delete called...");

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from("cleaning_jobs")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ Supabase delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Job ${id} deleted successfully`);
    return NextResponse.json({
      message: "Job deleted successfully",
    });
  } catch (err) {
    console.error("💥 Fatal error deleting job:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
