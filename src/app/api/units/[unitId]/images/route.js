import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req, { params }) {
  try {
    // ✅ CLAVE: await auth()
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { unitId } = params;
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 🔐 Service role (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const filePath = `${unitId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("unit-images")
      .upload(filePath, file, {
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("unit-images")
      .getPublicUrl(filePath);

    // 🔑 Guardar en DB
    const { data: unit } = await supabase
      .from("units")
      .select("images")
      .eq("id", unitId)
      .single();

    const images = unit?.images || [];
    const newImages = [...images, data.publicUrl];

    await supabase.from("units").update({ images: newImages }).eq("id", unitId);

    return NextResponse.json({ images: newImages });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
