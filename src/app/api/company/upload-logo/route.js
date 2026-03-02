import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const companyId = formData.get("companyId");

    if (!file || !companyId) {
      return NextResponse.json(
        { error: "Missing file or companyId" },
        { status: 400 },
      );
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${companyId}-${Date.now()}.${fileExt}`;

    /* =========================
       UPLOAD TO STORAGE
    ========================= */
    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    /* =========================
       GET PUBLIC URL
    ========================= */
    const { data } = supabase.storage
      .from("company-logos")
      .getPublicUrl(fileName);

    const publicUrl = data.publicUrl;

    /* =========================
       UPDATE COMPANY RECORD
    ========================= */
    const { error: updateError } = await supabase
      .from("companies")
      .update({ logo_url: publicUrl })
      .eq("id", companyId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (err) {
    console.error("UPLOAD LOGO ERROR:", err);
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 },
    );
  }
}
