// /api/admin/jobs/route.js
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔐 validar admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("clerk_id", userId)
    .single();

  if (profileError || profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 📦 query libre (service role)
  const { data, error } = await supabase
    .from("cleaning_jobs")
    .select(
      `
      *,
      client:profiles!cleaning_jobs_assigned_client_fkey (
        id,
        full_name,
        email
      ),
      staff:profiles!cleaning_jobs_assigned_to_fkey (
        clerk_id,
        full_name,
        email
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
