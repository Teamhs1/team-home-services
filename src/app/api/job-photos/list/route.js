import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🧠 Cliente con Service Role Key (sin RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    console.log("🟢 [job-photos/list] Universal fetch sin RLS...");
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("job_id");

    if (!jobId)
      return NextResponse.json(
        { error: "Missing job_id parameter" },
        { status: 400 }
      );

    // 1️⃣ Traer todas las fotos desde la tabla
    const { data: dbPhotos, error } = await supabase
      .from("job_photos")
      .select("id, job_id, category, image_url, uploaded_by, created_at")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // 2️⃣ Normalizar URLs relativas -> absolutas
    const normalizeUrl = (url) => {
      if (!url) return null;
      if (url.startsWith("http")) return url;

      const clean = url.replace(/^\/?job-photos\//, "").trim();
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/job-photos/${clean}`;
    };

    const normalized = (dbPhotos || []).map((p) => ({
      ...p,
      image_url: normalizeUrl(p.image_url),
      category: p.category?.toLowerCase() || "general",
    }));

    // 3️⃣ También revisar el bucket (por si hay archivos sin registro)
    const { data: bucketFiles, error: storageError } = await supabase.storage
      .from("job-photos")
      .list(jobId, {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    if (storageError)
      console.warn("⚠️ No se pudo listar el bucket:", storageError.message);

    const bucketList =
      bucketFiles?.map((f) => ({
        job_id: jobId,
        image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/job-photos/${jobId}/${f.name}`,
        category: "general",
        uploaded_by: "bucket-only",
      })) || [];

    // 4️⃣ Combinar y eliminar duplicados
    const all = [...normalized, ...bucketList];
    const unique = Array.from(
      new Map(all.map((p) => [p.image_url, p])).values()
    );

    // 5️⃣ Agrupar
    const grouped = { before: [], after: [], general: [] };
    for (const photo of unique) {
      const cat = photo.category || "general";
      if (grouped[cat]) grouped[cat].push(photo);
      else grouped.general.push(photo);
    }

    console.log(`✅ ${unique.length} fotos combinadas para job ${jobId}`);
    return NextResponse.json({ success: true, data: grouped });
  } catch (err) {
    console.error("💥 Error en list photos:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
