import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const path = formData.get("path"); // ya viene listo desde el cliente
    const jobId = formData.get("job_id");
    const category = formData.get("category") || "general";
    const type = formData.get("type") || "general";

    if (!file || !path || !jobId) {
      return NextResponse.json(
        { error: "Missing file, path or jobId" },
        { status: 400 }
      );
    }

    // -----------------------------
    // 🔥 NO CAMBIAR EL PATH!
    // -----------------------------

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Convertir el archivo a buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Subir el archivo
    const { error: uploadError } = await supabase.storage
      .from("job-photos")
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    // Guardar en tabla
    const { data: photo, error: insertError } = await supabase
      .from("job_photos")
      .insert([
        {
          job_id: jobId,
          category,
          type, // <-- Guardado correcto
          image_url: path, // <-- NO modificar
          uploaded_by: "system",
        },
      ])
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json(
      { message: "File uploaded successfully", photo },
      { status: 200 }
    );
  } catch (err) {
    console.error("💥 Upload Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
