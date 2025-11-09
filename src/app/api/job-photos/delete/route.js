import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function DELETE(req) {
  try {
    console.log("🗑️ [Delete] Solicitud recibida (sin RLS)");
    const { image_url } = await req.json();

    if (!image_url) {
      return NextResponse.json({ error: "Missing image_url" }, { status: 400 });
    }

    // 🧩 Extrae la ruta dentro del bucket
    const url = new URL(image_url);
    const path = decodeURIComponent(
      url.pathname.replace("/storage/v1/object/public/job-photos/", "")
    );

    // 🧹 Borra el archivo del bucket
    const { error: storageError } = await supabase.storage
      .from("job-photos")
      .remove([path]);

    if (storageError) throw storageError;

    // 🧹 Borra el registro de la tabla
    const { error: dbError } = await supabase
      .from("job_photos")
      .delete()
      .eq("image_url", image_url);

    if (dbError) throw dbError;

    console.log("✅ Foto eliminada correctamente:", path);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("💥 Delete error:", err.message);
    return NextResponse.json(
      { error: err.message || "Unexpected delete error" },
      { status: 500 }
    );
  }
}
