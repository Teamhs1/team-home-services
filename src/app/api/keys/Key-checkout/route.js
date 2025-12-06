import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { key_code, user_name } = await req.json();

    if (!key_code) {
      return NextResponse.json({ error: "Missing key_code" }, { status: 400 });
    }

    // Buscar la llave por key_code
    const { data: key, error: keyError } = await supabase
      .from("keys")
      .select("*")
      .eq("key_code", key_code)
      .single();

    if (keyError || !key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    // Actualizar status
    await supabase
      .from("keys")
      .update({ status: "checked_out" })
      .eq("key_code", key_code);

    // Registrar log
    await supabase.from("key_logs").insert({
      key_code,
      action: "checked_out",
      user_name,
    });

    return NextResponse.json({ message: "Key checked out successfully" });
  } catch (err) {
    console.error("Checkout API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
