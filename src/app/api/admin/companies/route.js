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
      email,
      phone,
      company_members (
        role,
        profile:profiles (
          id,
          full_name
        )
      ),
      properties:properties ( id )
    `
    )
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const normalized = (data || []).map((c) => {
    const owner =
      c.company_members.find((m) => m.role === "owner") ||
      c.company_members.find((m) => m.role === "admin") ||
      null;

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      owner: owner?.profile || null,
      properties_count: c.properties?.length ?? 0,
      users_count: c.company_members?.length ?? 0,
    };
  });

  return NextResponse.json(normalized);
}
