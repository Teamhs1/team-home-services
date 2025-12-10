import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req, context) {
  // 🔥 params ahora es un Promise → se debe hacer await
  const { id } = await context.params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // service role para lectura segura
  );

  // Buscar por tag_code primero
  let { data, error } = await supabase
    .from("keys")
    .select("*")
    .eq("tag_code", id)
    .maybeSingle();

  // Si no existe → buscar por id (UUID)
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
