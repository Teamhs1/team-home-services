import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: { bodyParser: false },
};

// 🔥 Categorías consideradas “general areas”
const GENERAL_AREAS = [
  "kitchen",
  "bathroom",
  "living_room",
  "bedroom",
  "laundry_unit",
  "balcony_area",
  "glass_shower_area",
  "double_sink_area",
];

// Extra: cualquier categoría bedroom_X (bedroom_1, bedroom_2…)
const isGeneralArea = (category) => {
  if (!category) return false;
  if (GENERAL_AREAS.includes(category)) return true;
  if (category.startsWith("bedroom_")) return true;
  return false;
};

export async function POST(req) {
  try {
    // CORS — Opcional
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const formData = await req.formData();

    let file = formData.get("file");
    let path = formData.get("path");

    const jobId = formData.get("job_id");
    const category = formData.get("category") || "general";
    let type = formData.get("type"); // "before" o "after" – viene del frontend

    // 🛑 Validación mínima
    if (!file || !path || !jobId) {
      return NextResponse.json(
        { error: "Missing file, path or jobId" },
        { status: 400 }
      );
    }

    console.log("📸 Upload received:", {
      jobId,
      category,
      type,
      originalFilename: file.name,
    });

    // 🔥 Reglas de clasificación
    // El frontend SIEMPRE manda “before” o “after”.
    // Nosotros **corregimos** automáticamente si es un General Area.
    if (isGeneralArea(category)) {
      type = "after";
    }

    // Fallback por si el frontend mandara algo inesperado
    if (type !== "before" && type !== "after") {
      console.warn("⚠ Invalid type received. Forcing type=after.");
      type = "after";
    }

    // ------------------------------------------------------------
    // CLEAN FILE NAME
    // ------------------------------------------------------------
    const cleanName = file.name
      .replace(/\s+/g, "_")
      .replace(/[()]/g, "")
      .replace(/#/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    path = path.replace(file.name, cleanName);

    // ------------------------------------------------------------
    // DETECT MIME TYPE (HEIC fix)
    // ------------------------------------------------------------
    let contentType = file.type || "image/jpeg";

    if (cleanName.toLowerCase().endsWith(".heic")) contentType = "image/heic";
    if (cleanName.toLowerCase().endsWith(".heif")) contentType = "image/heif";

    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // ------------------------------------------------------------
    // UPLOAD TO STORAGE
    // ------------------------------------------------------------
    const { error: uploadError } = await supabase.storage
      .from("job-photos")
      .upload(path, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Upload Error:", uploadError);
      throw new Error(uploadError.message);
    }

    // ------------------------------------------------------------
    // INSERT IN DATABASE
    // ------------------------------------------------------------
    const { data: photo, error: insertError } = await supabase
      .from("job_photos")
      .insert([
        {
          job_id: jobId,
          category,
          type,
          image_url: path,
          uploaded_by: "system",
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("❌ Insert DB Error:", insertError);
      throw new Error(insertError.message);
    }

    console.log("✅ Upload complete:", { path });

    return NextResponse.json(
      {
        success: true,
        message: "File uploaded successfully",
        photo,
      },
      {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (err) {
    console.error("💥 SERVER ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
