import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ SERVICE ROLE (NO JWT, NO RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const body = await req.json();

  const {
    title,
    service_type,
    assigned_to,
    assigned_client,
    company_id,
    scheduled_date,
    unit_type, // ✅ AÑADIDO
    features, // ✅ AÑADIDO
  } = body;

  if (!title || !scheduled_date || !company_id || !assigned_client) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (assigned_client.startsWith("user_")) {
    return NextResponse.json(
      { error: "assigned_client must be a profile UUID" },
      { status: 400 }
    );
  }

  // 🔑 map clerk → profile
  const { data: creatorProfile, error: creatorError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_id", userId)
    .single();

  if (creatorError || !creatorProfile) {
    return NextResponse.json(
      { error: "Creator profile not found" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("cleaning_jobs")
    .insert({
      title: title.trim(),
      service_type: service_type || "standard",
      assigned_to: assigned_to || null,
      assigned_client,
      company_id,
      scheduled_date,
      unit_type: unit_type || null, // ✅
      features: Array.isArray(features) ? features : [], // ✅
      status: "pending",
      created_by: creatorProfile.id,
    })

    .select()
    .single();

  if (error) {
    console.error("❌ Insert job error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ job: data });
}
