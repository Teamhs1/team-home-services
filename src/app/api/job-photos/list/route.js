import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role (sin RLS)
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

    // ============================================================
    // 1) FOTOS EN DB
    // ============================================================
    const { data: dbPhotos, error } = await supabase
      .from("job_photos")
      .select("id, job_id, category, type, image_url, uploaded_by, created_at")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // ============================================================
    // 2) Normalizar URL
    // ============================================================
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

    // ============================================================
    // 3) Detectar tipo final correctamente
    // ============================================================
    const detectType = (photo) => {
      const t = photo.type?.toLowerCase() || "";
      const cat = photo.category?.toLowerCase() || "";
      const file = photo.image_url?.toLowerCase() || "";

      // si BD ya tiene type válido, respetarlo
      if (t === "before" || t === "after") return t;

      // por categoría explícita
      if (cat === "before" || cat === "after") return cat;

      // por carpeta
      if (file.includes("/before/")) return "before";
      if (file.includes("/after/")) return "after";

      // por nombre de archivo
      if (file.includes("before_")) return "before";
      if (file.includes("after_")) return "after";

      return "general";
    };

    const normalizedDb = dbPhotos.map((p) => ({
      ...p,
      image_url: normalizeUrl(p.image_url),
      type: detectType(p),
    }));

    // ============================================================
    // 4) Revisar bucket por si hay fotos huérfanas
    // ============================================================
    const bucketPath = jobId + "/";
    const { data: bucketList } = await supabase.storage
      .from("job-photos")
      .list(bucketPath, {
        limit: 200,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    const bucketItems =
      bucketList?.map((file) => {
        const url = `${
          process.env.NEXT_PUBLIC_SUPABASE_URL
        }/storage/v1/object/public/job-photos/${jobId}/${encodeURIComponent(
          file.name
        )}`;

        const lower = file.name.toLowerCase();

        return {
          id: `bucket-${file.name}`,
          job_id: jobId,
          image_url: url,
          category: "general",
          uploaded_by: "bucket-only",
          type: lower.includes("before")
            ? "before"
            : lower.includes("after")
            ? "after"
            : "general",
          created_at: file.created_at || null,
        };
      }) || [];

    // ============================================================
    // 5) COMBINAR Y DEDUPLICAR POR URL
    // ============================================================
    const all = [...normalizedDb, ...bucketItems];

    const unique = Array.from(
      new Map(all.map((p) => [p.image_url, p])).values()
    );

    // ============================================================
    // 6) FILTRAR ARCHIVOS CORRUPTOS (sin extensión válida)
    // ============================================================
    const validImages = unique.filter((p) => {
      const url = p.image_url.toLowerCase();
      return (
        url.endsWith(".jpg") ||
        url.endsWith(".jpeg") ||
        url.endsWith(".png") ||
        url.endsWith(".webp") ||
        url.endsWith(".heic") ||
        url.endsWith(".heif")
      );
    });

    // ============================================================
    // 7) AGRUPAR PARA EL SLIDER
    // ============================================================
    const grouped = {
      before: [],
      after: [],
      general: [],
    };

    validImages.forEach((p) => {
      if (p.type === "before") grouped.before.push(p);
      else if (p.type === "after") grouped.after.push(p);
      else grouped.general.push(p);
    });

    // ============================================================
    // 8) Ordenar: primero Compare, luego General Areas
    // ============================================================
    const sortCompare = (arr) =>
      arr.sort((a, b) => (a.created_at > b.created_at ? 1 : -1));

    grouped.before = sortCompare(grouped.before);
    grouped.after = sortCompare(grouped.after);
    grouped.general = sortCompare(grouped.general);

    // ============================================================
    // 9) Devolver respuesta limpia
    // ============================================================
    return NextResponse.json({
      success: true,
      data: grouped,
      total_photos:
        grouped.before.length + grouped.after.length + grouped.general.length,
    });
  } catch (err) {
    console.error("💥 Error en list photos:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
