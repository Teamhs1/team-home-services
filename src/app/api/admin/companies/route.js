import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/utils/supabase/server";

async function requireSuperAdmin() {
  const { userId } = await auth();
  if (!userId) return false;

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("role")
    .eq("clerk_id", userId)
    .single();

  return profile?.role === "super_admin";
}

export async function GET() {
  const allowed = await requireSuperAdmin();

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
      billing_enabled,
      internal_company,
      subscription_status,
      plan_type,
      subscription_current_period_end,
      max_units,
      current_units,
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
      billing_enabled: c.billing_enabled ?? false,
      internal_company: c.internal_company ?? false,
      subscription_status: c.subscription_status ?? "inactive",
      plan_type: c.plan_type ?? null,
      subscription_current_period_end:
        c.subscription_current_period_end ?? null,
      max_units: c.max_units ?? 0,
      current_units: c.current_units ?? 0,
    };
  });

  return NextResponse.json(normalized);
}
