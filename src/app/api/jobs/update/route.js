import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 🚀 API sin JWT ni RLS
 * Usa la SERVICE_ROLE_KEY para actualizar libremente cualquier registro.
 */
export async function POST(req) {
  try {
    console.log("🟢 /api/jobs/update called...");

    // 🔑 Cliente Supabase con SERVICE ROLE (sin RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ Usa tu clave secreta aquí
    );

    // 🧩 Leer body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { id, status, assigned_to } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    // 🔧 Campos a actualizar
    const updates = {};
    if (status) updates.status = status;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;

    // 💾 Ejecutar update sin RLS
    const { data, error } = await supabase
      .from("cleaning_jobs")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      console.error("❌ Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data?.length) {
      return NextResponse.json(
        { error: "Job not found or update failed" },
        { status: 404 }
      );
    }

    console.log(`✅ Job ${id} updated successfully`);
    return NextResponse.json({
      message: "Job updated successfully",
      data,
    });
  } catch (err) {
    console.error("💥 Fatal error in /api/jobs/update:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
