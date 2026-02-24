import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get("company_id");

    if (!companyIdParam) {
      return NextResponse.json([], { status: 200 });
    }

    let permissions;

    try {
      permissions = await getAllowedCompanyIds(userId);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    /* =========================
       👑 SUPER ADMIN
    ========================= */

    if (permissions.role === "super_admin") {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name, company_id")
        .eq("company_id", companyIdParam)
        .order("name");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data || []);
    }

    /* =========================
       🔐 VALIDATE COMPANY ACCESS
    ========================= */

    if (!permissions.allowedCompanyIds.includes(companyIdParam)) {
      return NextResponse.json(
        { error: "Not authorized for this company" },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("properties")
      .select("id, name, company_id")
      .eq("company_id", companyIdParam)
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 },
    );
  }
}
