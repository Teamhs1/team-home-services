import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { unitId } = params;

    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadedImages = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const fileName = `${unitId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("unit-images")
        .upload(fileName, buffer, {
          contentType: file.type,
        });

      if (uploadError) {
        console.error(uploadError);
        continue;
      }

      const { data } = supabase.storage
        .from("unit-images")
        .getPublicUrl(fileName);

      const imageUrl = data.publicUrl;

      const { data: image } = await supabase
        .from("unit_images")
        .insert({
          unit_id: unitId,
          url: imageUrl,
        })
        .select()
        .single();

      uploadedImages.push(image);
    }

    return NextResponse.json({
      images: uploadedImages,
    });
  } catch (err) {
    console.error("UPLOAD IMAGE ERROR:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
