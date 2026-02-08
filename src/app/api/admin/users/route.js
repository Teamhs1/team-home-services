// /app/api/admin/users/route.js
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/utils/supabase/serverAdmin";

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(
      `
      id,
      clerk_id,
      full_name,
      email,
      avatar_url,
      role,
      status,
      created_at,
      company_id,
      companies:company_id (
        id,
        name
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}
