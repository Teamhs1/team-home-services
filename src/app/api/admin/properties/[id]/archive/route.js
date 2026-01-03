// app/api/properties/[id]/archive/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/* ======================================================
   CLIENTE SERVICE ROLE (BYPASS RLS)
====================================================== */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ======================================================
   PATCH – ARCHIVE PROPERTY
====================================================== */
export async function PATCH(req, { params }) {
  // 🔥 DEBUG CRÍTICO
  console.log("🧪 ARCHIVE PARAMS:", params);

  const { id } = params || {};
  console.log("🧪 ARCHIVE ID:", id);

  /* =====================
     VALIDAR ID
  ===================== */
  if (!id) {
    return NextResponse.json(
      { error: "Missing property id in route params" },
      { status: 400 }
    );
  }

  /* =====================
     AUTH CLERK
  ===================== */
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* =====================
     VALIDAR SERVICE ROLE KEY
  ===================== */
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SERVICE ROLE KEY NOT LOADED");
    return NextResponse.json(
      { error: "Server misconfiguration: service role key missing" },
      { status: 500 }
    );
  }

  /* =====================
     VALIDAR ADMIN
  ===================== */
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("clerk_id", userId)
    .single();

  if (profileError) {
    console.error("❌ PROFILE ERROR:", profileError);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  /* =====================
     ARCHIVE PROPERTY
  ===================== */
  const { data, error } = await supabaseAdmin
    .from("properties")
    .update({ is_active: false })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("❌ ARCHIVE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    console.error("❌ NO ROW UPDATED FOR ID:", id);
    return NextResponse.json(
      { error: "Property not found or already archived" },
      { status: 404 }
    );
  }

  /* =====================
     SUCCESS
  ===================== */
  return NextResponse.json({ success: true });
}
