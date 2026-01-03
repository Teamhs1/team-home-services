import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function POST(req, context) {
  const { id: tag_code } = await context.params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  /* PROFILE */
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id, full_name")
    .eq("clerk_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  /* KEY */
  const { data: key } = await supabase
    .from("keys")
    .select("id, status")
    .eq("tag_code", tag_code)
    .single();

  if (!key) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  if (key.status !== "available") {
    return NextResponse.json({ error: "Key not available" }, { status: 400 });
  }

  /* 🔒 CERRAR CUALQUIER CUSTODIA ACTIVA (SEGURIDAD) */
  await supabase
    .from("key_custody")
    .update({
      action: "checkin",
      returned_at: new Date().toISOString(),
    })
    .eq("key_id", key.id)
    .is("returned_at", null);

  /* ✅ CREAR NUEVA CUSTODIA ACTIVA */
  await supabase.from("key_custody").insert({
    key_id: key.id,
    holder_type: "staff",
    holder_id: profile.id,
    holder_label: profile.full_name,
    company_id: profile.company_id,
    action: "checkout",
    returned_at: null,
  });

  /* UPDATE KEY */
  await supabase.from("keys").update({ status: "assigned" }).eq("id", key.id);

  return NextResponse.json({ success: true });
}
