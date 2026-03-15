import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { unitId } = params;

    /* =====================
       VALIDATE USER
    ===================== */

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("clerk_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const isAdmin = profile.role === "admin";
    const isSuperAdmin = profile.role === "super_admin";

    /* =====================
       VALIDATE UNIT
    ===================== */

    const { data: unit } = await supabase
      .from("units")
      .select(
        `
        id,
        property:properties (
          company_id
        )
      `,
      )
      .eq("id", unitId)
      .single();

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    if (
      !isSuperAdmin &&
      !isAdmin &&
      unit.property.company_id !== profile.company_id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* =====================
       GET FILES
    ===================== */

    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadedImages = [];

    for (const file of files) {
      if (!file || typeof file === "string") continue;

      /* type validation */

      if (!ALLOWED_TYPES.includes(file.type)) {
        continue;
      }

      /* size validation */

      if (file.size > MAX_FILE_SIZE) {
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      const uniqueName =
        crypto.randomUUID() + "-" + file.name.replace(/\s+/g, "-");

      const filePath = `${unitId}/${uniqueName}`;

      /* =====================
         UPLOAD STORAGE
      ===================== */

      const { error: uploadError } = await supabase.storage
        .from("unit-images")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("STORAGE ERROR:", uploadError);
        continue;
      }

      /* =====================
         GET PUBLIC URL
      ===================== */

      const { data: publicUrlData } = supabase.storage
        .from("unit-images")
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      /* =====================
         INSERT DB
      ===================== */

      const { data: image, error: insertError } = await supabase
        .from("unit_images")
        .insert({
          unit_id: unitId,
          url: imageUrl,
        })
        .select()
        .single();

      if (insertError) {
        console.error("DB INSERT ERROR:", insertError);
        continue;
      }

      uploadedImages.push(image);
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
    });
  } catch (err) {
    console.error("UPLOAD IMAGE ERROR:", err);

    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
