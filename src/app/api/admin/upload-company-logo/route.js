import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const companyId = formData.get("companyId");

    if (!file || !companyId) {
      return NextResponse.json(
        { error: "Missing file or companyId" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // 🔥 IMPORTANTE
    );

    const fileExt = file.name.split(".").pop();
    const fileName = `${companyId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("company-logos")
      .getPublicUrl(fileName);

    const logoUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("companies")
      .update({ logo_url: logoUrl })
      .eq("id", companyId);

    if (updateError) throw updateError;

    return NextResponse.json({ logoUrl });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
