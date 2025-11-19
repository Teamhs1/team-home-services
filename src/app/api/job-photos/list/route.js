import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🧠 Cliente con Service Role Key (sin RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("job_id");

    if (!jobId)
      return NextResponse.json(
        { error: "Missing job_id parameter" },
        { status: 400 }
      );

    // 1️⃣ Traer fotos desde la BD
    const { data: dbPhotos, error } = await supabase
      .from("job_photos")
      .select("id, job_id, category, type, image_url, uploaded_by, created_at")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // 2️⃣ Normalizar URL absoluta
    const normalizeUrl = (url) => {
      if (!url) return null;
      if (url.startsWith("http")) return url;

      const clean = url.replace(/^\/?job-photos\//, "").trim();
      const encoded = clean
        .split("/")
        .map((x) => encodeURIComponent(x))
        .join("/");

      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/job-photos/${encoded}`;
    };

    // 3️⃣ Detectar tipo correctamente
    const detectType = (p) => {
      const file = p.image_url?.toLowerCase() || "";
      const cat = p.category?.toLowerCase() || "";
      const t = p.type?.toLowerCase() || "";

      // 🟢 Si BD tiene type -> respetarlo
      if (t === "before" || t === "after") return t;

      // 🟡 categoría explícita
      if (cat === "before" || cat === "after") return cat;

      // 🔵 detectar imágenes antiguas
      if (file.includes("before_")) return "before";
      if (file.includes("after_")) return "after";

      // 🔵 detectar rutas nuevas por carpeta
      if (file.includes("/before/")) return "before";
      if (file.includes("/after/")) return "after";

      return "general";
    };

    const normalized = (dbPhotos || []).map((p) => ({
      ...p,
      image_url: normalizeUrl(p.image_url),
      type: detectType(p),
    }));

    // 4️⃣ Revisar bucket por si hay fotos huérfanas
    const { data: bucketFiles } = await supabase.storage
      .from("job-photos")
      .list(jobId, { limit: 200 });

    const bucketList =
      bucketFiles?.map((f) => {
        const fullUrl = `${
          process.env.NEXT_PUBLIC_SUPABASE_URL
        }/storage/v1/object/public/job-photos/${jobId}/${encodeURIComponent(
          f.name
        )}`;

        const fileLower = f.name.toLowerCase();

        return {
          id: `bucket-${f.name}`,
          job_id: jobId,
          image_url: fullUrl,
          category: "general",
          uploaded_by: "bucket-only",
          type: fileLower.includes("before")
            ? "before"
            : fileLower.includes("after")
            ? "after"
            : "general",
        };
      }) || [];

    // 5️⃣ Combinar y deduplicar por URL
    const all = [...normalized, ...bucketList];
    const unique = Array.from(
      new Map(all.map((p) => [p.image_url, p])).values()
    );

    // 6️⃣ Agrupar por type final
    const grouped = { before: [], after: [], general: [] };

    unique.forEach((p) => {
      if (p.type === "before") grouped.before.push(p);
      else if (p.type === "after") grouped.after.push(p);
      else grouped.general.push(p);
    });

    return NextResponse.json({ success: true, data: grouped });
  } catch (err) {
    console.error("💥 Error en list photos:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
