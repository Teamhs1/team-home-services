import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// 👇 agrega esto
console.log("🔑 SERVICE ROLE LOADED:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const jobId = formData.get("jobId");
    const uploadedBy = formData.get("uploadedBy");
    const type = formData.get("type") || "before";

    if (!file || !jobId) {
      return NextResponse.json(
        { error: "Missing file or jobId" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop();
    const filePath = `${jobId}/${type}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("job-photos")
      .upload(filePath, buffer, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage
      .from("job-photos")
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("job_photos").insert([
      {
        job_id: jobId,
        uploaded_by: uploadedBy,
        type,
        image_url: publicData.publicUrl,
      },
    ]);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, url: publicData.publicUrl });
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
