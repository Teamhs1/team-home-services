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
        full_name
      )
    `
    )
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Normalizamos para el frontend
  const normalized = (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    owner: c.owners?.[0] || null, // 1 owner por company
  }));

  return NextResponse.json(normalized);
}
