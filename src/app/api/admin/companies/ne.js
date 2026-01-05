// src/app/api/admin/companies/route.js
import "server-only";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("companies")
    .select(
      `
      id,
      name,
      owners (
        id,
        full_name,
        clerk_id
      )
    `
    )
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ✅ NORMALIZACIÓN CORRECTA
  const normalized = (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    client: c.owners?.[0] || null, // 👈 owner = client
  }));

  return NextResponse.json(normalized);
}
