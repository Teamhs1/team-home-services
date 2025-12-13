// app/api/jobs/delete-bulk/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // 🔥 CLAVE

export async function POST(req) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No job IDs provided" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // 🔥 SERVICE ROLE REAL
    );

    const { data, error } = await supabase
      .from("cleaning_jobs")
      .delete()
      .in("id", ids)
      .select("id"); // 🔥 OBLIGATORIO para ver cuántos borró

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
      { status: 500 }
    );
  }
}
