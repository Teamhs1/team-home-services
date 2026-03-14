import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getProfileByClerkId } from "@/lib/permissions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =========================
   GET PROPERTIES (CLIENT)
========================= */
export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfileByClerkId(userId);

    if (!profile) {
      return NextResponse.json({ data: [] });
    }

    const companyId = profile.active_company_id;

    if (!companyId) {
      console.warn("❌ No active company for user", userId);
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
      .from("properties")
      .select(
        `
        id,
        name,
        address,
        unit,
        created_at,
        company_id,
        owner_id,
        owners:owner_id (
          id,
          full_name
        ),
        companies:company_id (
          id,
          name
        )
      `,
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("DB ERROR:", error);
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error("💥 API ERROR:", err);
    return NextResponse.json({ data: [] });
  }
}

/* =========================
   CREATE PROPERTY (CLIENT)
========================= */
export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfileByClerkId(userId);

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    const companyId = profile.active_company_id;

    if (!companyId) {
      console.warn("❌ No active company for user", userId);

      return NextResponse.json(
        { error: "No active company for this user" },
        { status: 400 },
      );
    }

    const body = await req.json();

    const { name, address, unit } = body;

    if (!name || !address) {
      return NextResponse.json(
        { error: "Property name and address are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("properties")
      .insert({
        name,
        address,
        unit: unit || null,
        company_id: companyId,
      })
      .select()
      .single();

    if (error) {
      console.error("DB INSERT ERROR:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("💥 CREATE PROPERTY ERROR:", err);

    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
