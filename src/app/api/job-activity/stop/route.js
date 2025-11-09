import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { job_id, staff_id } = await req.json();

    if (!job_id) {
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
    }

    // 🔑 Cliente con Service Role Key (bypassa RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1️⃣ Buscar el último registro de inicio
    const { data: startData, error: startError } = await supabase
      .from("job_activity_log")
      .select("created_at")
      .eq("job_id", job_id)
      .eq("action", "start")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (startError) throw startError;
    if (!startData) {
      return NextResponse.json(
        { error: "No start record found for this job" },
        { status: 404 }
      );
    }

    // 2️⃣ Calcular duración
    const startTime = new Date(startData.created_at);
    const endTime = new Date();
    const diffSeconds = Math.floor((endTime - startTime) / 1000);
    const durationMinutes = Math.max(Math.floor(diffSeconds / 60), 1); // mínimo 1 minuto

    console.log(
      `⏱️ Job ${job_id} started at ${startTime.toISOString()} — ended at ${endTime.toISOString()} (${durationMinutes} min)`
    );

    // 3️⃣ Insertar registro "stop" en el log
    const { error: insertError } = await supabase
      .from("job_activity_log")
      .insert([
        {
          job_id,
          staff_id,
          action: "stop",
          notes: `Job completed in ${durationMinutes} min.`,
          duration_seconds: diffSeconds,
          created_at: endTime.toISOString(),
        },
      ]);
    if (insertError) throw insertError;

    // 4️⃣ Actualizar el job principal (asegúrate de que el id coincida)
    const { data: updateData, error: updateError } = await supabase
      .from("cleaning_jobs")
      .update({
        status: "completed",
        duration_minutes: durationMinutes,
        completed_at: endTime.toISOString(),
      })
      .eq("id", job_id)
      .select("id, status, duration_minutes")
      .maybeSingle();

    if (updateError) throw updateError;

    console.log("✅ Job updated successfully:", updateData);

    return NextResponse.json({
      message: "Job stopped and duration saved",
      durationMinutes,
      job: updateData,
    });
  } catch (err) {
    console.error("💥 Job stop error:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected error stopping job" },
      { status: 500 }
    );
  }
}
