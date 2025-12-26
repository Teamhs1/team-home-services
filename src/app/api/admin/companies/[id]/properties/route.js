import "server-only";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";

export async function GET(req, { params }) {
  const { id } = params;

  // 👇 ESTE es el punto clave
  const { data, error } = await supabaseServer
    .from("properties")
    .select("id, name, address, unit")
    .eq("company_id", id) // ← DEBE ser esta columna
    .order("name", { ascending: true });

  if (error) {
    console.error("PROPERTIES ERROR:", error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data || []);
}
