import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 🚀 Versión sin JWT ni RLS — usa Service Role Key directamente
 */
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const path = formData.get("path");
    const jobId = formData.get("job_id");
    const category = formData.get("category") || "general";

    if (!file || !path) {
      return NextResponse.json(
        { error: "Missing file or path" },
        { status: 400 }
      );
    }

    // 🔑 Cliente Supabase con Service Role Key (sin políticas ni JWT)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 📤 Subir archivo
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("job-photos")
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    // 🗃️ Insertar registro en tabla job_photos
    const { data: photo, error: insertError } = await supabase
      .from("job_photos")
      .insert([
        { job_id: jobId, category, image_url: path, uploaded_by: "system" },
      ])
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ message: "File uploaded successfully", photo });
  } catch (err) {
    console.error("💥 Upload Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
