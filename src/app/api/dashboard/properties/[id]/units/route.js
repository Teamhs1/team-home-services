import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

/* 🧪 Health check (EVITA Failed to fetch silencioso) */
export async function GET() {
  return NextResponse.json({ ok: true });
}

/* =========================
   CREATE UNITS (CLIENT)
========================= */
export async function POST(req, ctx) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ NEXT 15 SAFE ACCESS
    const { params } = ctx;
    if (!params?.id) {
      return NextResponse.json(
        { error: "Missing property id" },
        { status: 400 }
      );
    }

    const property_id = params.id;
    const { units, type } = await req.json();

    if (!Array.isArray(units) || units.length === 0) {
      return NextResponse.json({ error: "Invalid units" }, { status: 400 });
    }

    const token = await getToken({ template: "supabase" });
    const supabase = getSupabase(token);

    /* PROFILE */
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .single();

    if (!profile || profile.role !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* PROPERTY OWNERSHIP */
    const { data: property } = await supabase
      .from("properties")
      .select("company_id")
      .eq("id", property_id)
      .single();

    if (!property || property.company_id !== profile.company_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* CLEAN UNITS */
    const cleanUnits = [
      ...new Set(units.map((u) => String(u).trim()).filter(Boolean)),
    ];

    const payload = cleanUnits.map((unit) => ({
      property_id,
      unit,
      type: type || null,
      company_id: profile.company_id,
    }));

    const { data, error } = await supabase
      .from("units")
      .insert(payload)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, created: data.length, units: data },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ CLIENT CREATE UNITS ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
