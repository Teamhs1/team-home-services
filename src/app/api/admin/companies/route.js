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
        logo_url,
        created_at,
        company_members (
          role,
          profile:profiles (
            id,
            full_name
          )
        ),
        properties:properties ( id )
      `,
    )
    .order("name", { ascending: true });

  if (error) {
    console.error("COMPANIES FETCH ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const normalized = (data ?? []).map((c) => {
    const members = c.company_members ?? [];

    const owner =
      members.find((m) => m.role === "owner") ||
      members.find((m) => m.role === "admin") ||
      null;

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      logo_url: c.logo_url ?? null,
      created_at: c.created_at ?? null,
      owner: owner?.profile ?? null,
      properties_count: c.properties?.length ?? 0,
      users_count: members.length,
    };
  });

  return NextResponse.json(normalized);
}
