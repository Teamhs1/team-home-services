import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =========================
   GET → List keys
========================= */
export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("company_id");

    /* =========================
       LOAD USER PROFILE
    ========================= */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    /* =========================
       BASE QUERY
    ========================= */
    let query = supabase
      .from("keys")
      .select(
        `
        id,
        tag_code,
        unit,
        type,
        status,
        is_reported,
        property_id,
        properties:property_id (
          id,
          name,
          company_id,
          address
        )
      `,
      )
      .order("unit", { ascending: true });

    /* =========================
       ROLE FILTER
    ========================= */

    // super_admin → ve todo
    if (profile.role === "super_admin") {
      // no filtro
    }

    // admin → solo properties de su company
    else if (profile.role === "admin") {
      const { data: propertyIds, error } = await supabase
        .from("properties")
        .select("id")
        .eq("company_id", profile.company_id);

      if (error) throw error;

      const ids = propertyIds.map((p) => p.id);

      if (!ids.length) {
        return NextResponse.json({ keys: [] });
      }

      query = query.in("property_id", ids);
    }

    // client → solo sus properties
    else if (profile.role === "client") {
      const { data: propertyIds, error } = await supabase
        .from("properties")
        .select("id")
        .eq("client_id", profile.id);

      if (error) throw error;

      const ids = propertyIds.map((p) => p.id);

      if (!ids.length) {
        return NextResponse.json({ keys: [] });
      }

      query = query.in("property_id", ids);
    }

    /* =========================
       OPTIONAL COMPANY FILTER
       (UI filter)
    ========================= */
    if (companyId) {
      const { data: propertyIds, error } = await supabase
        .from("properties")
        .select("id")
        .eq("company_id", companyId);

      if (error) throw error;

      const ids = propertyIds.map((p) => p.id);

      if (!ids.length) {
        return NextResponse.json({ keys: [] });
      }

      query = query.in("property_id", ids);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ keys: data });
  } catch (err) {
    console.error("❌ KEYS API GET ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =========================
   POST → Create key
========================= */
export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔐 Validate admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (
      profileError ||
      (profile?.role !== "admin" && profile?.role !== "super_admin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { property_id, unit, type, tag_code, status } = await req.json();

    if (!property_id || !type || !tag_code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("keys")
      .insert({
        property_id,
        unit,
        type,
        tag_code,
        status: status || "available",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ key: data });
  } catch (err) {
    console.error("❌ KEYS API POST ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
