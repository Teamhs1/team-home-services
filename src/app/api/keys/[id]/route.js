import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req, { params }) {
  const { id } = params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // 🔥 usa service role
  );

  // Buscar por tag_code
  let { data, error } = await supabase
    .from("keys")
    .select("*")
    .eq("tag_code", id)
    .maybeSingle();

  // Si no existe por tag_code → buscar por id
  if (!data) {
    const uuidQuery = await supabase
      .from("keys")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    data = uuidQuery.data;
    error = uuidQuery.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  return NextResponse.json({ key: data });
}
