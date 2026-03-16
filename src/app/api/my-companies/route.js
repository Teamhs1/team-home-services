import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* profile */
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("clerk_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json([], { status: 200 });
  }

  /* super admin → todas */
  if (profile.role === "super_admin") {
    const { data } = await supabase.from("companies").select("id, name");

    return NextResponse.json(data || []);
  }

  /* companies where user is member */
  const { data } = await supabase
    .from("company_members")
    .select(
      `
      company_id,
      companies (
        id,
        name
      )
    `,
    )
    .eq("profile_id", profile.id);

  const companies = (data || []).map((m) => m.companies);

  return NextResponse.json(companies);
}
