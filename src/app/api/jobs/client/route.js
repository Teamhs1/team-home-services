export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 📌 leer mode desde query
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "owner";
  // owner | managed

  // 🔐 SERVICE ROLE (API-first, sin RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // 🔎 Validar perfil real
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("clerk_id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  if (profile.role !== "client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 🧠 base query
  let query = supabase
    .from("cleaning_jobs")
    .select(
      `
      id,
      title,
      service_type,
      property_address,
      scheduled_date,
      status,
      company_id,
      created_at,
      assigned_client_clerk_id,
      requested_by_clerk_id
    `,
    )
    .order("created_at", { ascending: false });

  // 👤 OWNER VIEW (jobs de mis propiedades)
  if (mode === "owner") {
    query = query.eq("assigned_client_clerk_id", userId);
  }

  // 🧑‍💼 MANAGED VIEW (jobs que gestiono)
  if (mode === "managed") {
    query = query.eq("requested_by_clerk_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    jobs: data || [],
    meta: {
      userId,
      mode,
      count: data?.length || 0,
    },
  });
}
