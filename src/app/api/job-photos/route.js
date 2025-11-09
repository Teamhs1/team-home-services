import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

// ✅ Cliente Supabase con Service Role Key (solo backend)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    console.log("🟢 Upload request received...");

    // ✅ Validar sesión con Clerk automáticamente
    const { userId, sessionClaims } = auth();

    if (!userId) {
      console.warn("🚫 No user session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = sessionClaims?.publicMetadata?.role || "client";
    console.log(`🧠 Uploading photo as user: ${userId} (role: ${role})`);

    // ✅ Obtener archivo desde el FormData
    const formData = await req.formData();
    const file = formData.get("file");
    const path = formData.get("path");

    if (!file || !path) {
      return NextResponse.json(
        { error: "Missing file or path" },
        { status: 400 }
      );
    }

    // 🔐 Control de acceso por rol (puedes personalizarlo)
    if (role === "client") {
      return NextResponse.json(
        { error: "Clients cannot upload job photos" },
        { status: 403 }
      );
    }

    // ✅ Subir archivo al bucket "job-photos"
    const { data, error } = await supabase.storage
      .from("job-photos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ Supabase upload error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ File uploaded successfully:", data?.path);
    return NextResponse.json({ success: true, path: data?.path });
  } catch (err) {
    console.error("💥 Upload API error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
