export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // 🔑 1. obtener profile UUID real
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("clerk_id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  if (profile.role !== "client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 📦 2. leer jobs asignados al client_profile_id
  const { data, error } = await supabase
    .from("cleaning_jobs")
    .select(
      `
      id,
      title,
      service_type,
      property_address,
      scheduled_date,
      status,
      created_at,
      client_profile_id
    `,
    )
    .eq("client_profile_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    jobs: data || [],
    meta: {
      profileId: profile.id,
      count: data?.length || 0,
    },
  });
}
