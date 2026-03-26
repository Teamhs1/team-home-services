// Uploads tenant documents
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = `applications/${Date.now()}-${file.name}`;

    console.log("Uploading:", fileName);

    const { data, error } = await supabase.storage
      .from("tenant-documents") // ✅ FIXED BUCKET
      .upload(fileName, file, {
        contentType: file.type, // ✅ IMPORTANTE
      });

    if (error) {
      console.error("UPLOAD ERROR:", error);
      throw error;
    }

    const { data: publicUrl } = supabase.storage
      .from("tenant-documents")
      .getPublicUrl(fileName);

    return NextResponse.json({
      url: publicUrl.publicUrl,
      path: fileName,
    });
  } catch (err) {
    console.error("UPLOAD FAILED:", err.message);

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
