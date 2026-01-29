import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* =====================
   GET KEY + ACTIVE CUSTODY
===================== */
export async function GET(req, context) {
  const { id } = await context.params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  /* =====================
     LOAD KEY (TAG_CODE or UUID)
  ===================== */
  let { data: key, error } = await supabase
    .from("keys")
    .select("*")
    .ilike("tag_code", id)
    .maybeSingle();

  if (!key) {
    const uuidQuery = await supabase
      .from("keys")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    key = uuidQuery.data;
    error = uuidQuery.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!key) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  /* =====================
     LOAD ACTIVE CUSTODY
  ===================== */
  const { data: custody } = await supabase
    .from("key_custody")
    .select(
      `
      id,
      holder_type,
      holder_label,
      holder_id,
      created_at
    `,
    )
    .eq("key_id", key.id)
    .is("returned_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    key: {
      ...key,
      custody: custody || null,
    },
  });
}
