export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(req, { params }) {
  try {
    console.log("🔥 COMPANY ADMIN OVERVIEW HIT");

    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const companyId = params?.id;

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Missing company id" },
        { status: 400 },
      );
    }

    /* ===============================
       📊 MEMBER COUNT
    =============================== */
    const { count: memberCount, error: memberError } = await supabase
      .from("company_members")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    if (memberError) {
      console.error("Member count error:", memberError);
    }

    /* ===============================
       🏠 PROPERTY COUNT
    =============================== */
    const { count: propertyCount, error: propertyError } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    if (propertyError) {
      console.error("Property count error:", propertyError);
    }

    /* ===============================
       🖼 COMPANY INFO
    =============================== */
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, logo_url, created_at")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      console.error("Company fetch error:", companyError);
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        company,
        members: memberCount || 0,
        properties: propertyCount || 0,
      },
    });
  } catch (err) {
    console.error("COMPANY ADMIN OVERVIEW ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Server error",
      },
      { status: 500 },
    );
  }
}
