import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* =====================
   GET KEY (EXISTENTE)
===================== */
export async function GET(req, context) {
  // 🔥 params ahora es un Promise → se debe hacer await
  const { id } = await context.params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // service role
  );

  // Buscar por tag_code primero
  let { data, error } = await supabase
    .from("keys")
    .select("*")
    .eq("tag_code", id)
    .maybeSingle();

  // Si no existe → buscar por UUID
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

/* =====================
   DELETE KEY (NUEVO)
===================== */
export async function DELETE(req, context) {
  const { id } = await context.params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // 🔐 ignora RLS
  );

  // 1️⃣ Intentar borrar por UUID
  let { error } = await supabase.from("keys").delete().eq("id", id);

  // 2️⃣ Si no borró nada, intentar por tag_code
  if (!error) {
    const { data } = await supabase
      .from("keys")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (!data) {
      const tagDelete = await supabase.from("keys").delete().eq("tag_code", id);

      error = tagDelete.error;
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
