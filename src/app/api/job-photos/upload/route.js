import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    // CORS
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

    // ⛔ JAMÁS permitir type="general"
    let type = formData.get("type");

    // 🔥 General areas → type siempre debe ser "after"
    if (
      category === "kitchen" ||
      category === "bathroom" ||
      category === "bedroom" ||
      category === "living_room"
    ) {
      type = "after";
    }

    // fallback
    if (!type || (type !== "before" && type !== "after")) {
      type = "after";
    }

    if (!file || !path || !jobId) {
      return NextResponse.json(
        { error: "Missing file, path or jobId" },
        { status: 400 }
      );
    }

    // Limpieza de filename
    const cleanName = file.name
      .replace(/\s+/g, "_")
      .replace(/[()]/g, "")
      .replace(/#/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    path = path.replace(file.name, cleanName);

    // HEIC/HEIF
    let contentType = file.type || "image/jpeg";

    if (cleanName.toLowerCase().endsWith(".heic")) {
      contentType = "image/heic";
    } else if (cleanName.toLowerCase().endsWith(".heif")) {
      contentType = "image/heif";
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Upload
    const { error: uploadError } = await supabase.storage
      .from("job-photos")
      .upload(path, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    // Insert DB
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

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json(
      {
        message: "File uploaded successfully",
        photo,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("💥 Upload Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
