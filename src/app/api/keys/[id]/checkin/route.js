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
    .select("id, company_id")
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

  /* 🔎 FIND ACTIVE CUSTODY */
  const { data: activeCustody } = await supabase
    .from("key_custody")
    .select("id")
    .eq("key_id", key.id)
    .is("returned_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activeCustody) {
    return NextResponse.json(
      { error: "No active checkout found for this key" },
      { status: 400 }
    );
  }

  /* ✅ CLOSE CUSTODY */
  await supabase
    .from("key_custody")
    .update({
      action: "checkin",
      returned_at: new Date().toISOString(),
    })
    .eq("key_id", key.id)
    .is("returned_at", null);

  /* UPDATE KEY */
  await supabase.from("keys").update({ status: "available" }).eq("id", key.id);

  return NextResponse.json({ success: true });
}
