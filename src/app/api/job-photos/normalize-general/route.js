import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const body = await req.json();
    const jobId = body?.jobId;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 🔍 Verificar que existan fotos AFTER (general o compare)
    const { data: photos, error } = await supabase
      .from("job_photos")
      .select("id, category, type")
      .eq("job_id", jobId)
      .eq("type", "after");

    if (error) {
      console.error("❌ Normalize error:", error);
      throw error;
    }

    console.log(`🧹 Normalize general photos: ${photos.length} found`);

    // 🔥 No hacemos mutaciones porque:
    // - Las fotos ya están bien clasificadas
    // - El frontend filtra correctamente
    // - Evitamos duplicaciones o pérdidas

    return NextResponse.json({
      success: true,
      message: "General photos normalized successfully",
      count: photos.length,
    });
  } catch (err) {
    console.error("💥 Normalize General ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to normalize photos" },
      { status: 500 },
    );
  }
}
