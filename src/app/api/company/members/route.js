// app/api/company/members/route.js

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =====================================================
   🔍 GET MEMBERS
===================================================== */
export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = await getAllowedCompanyIds(userId);

    const { searchParams } = new URL(req.url);
    let company_id = searchParams.get("company_id");

    /* =====================================
       🔎 Resolve company automatically
    ===================================== */

    if (!company_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_company_id")
        .eq("clerk_id", userId)
        .single();

      if (!profile?.active_company_id) {
        return NextResponse.json(
          { error: "No active company found" },
          { status: 400 },
        );
      }

      company_id = profile.active_company_id;
    }

    /* =====================================
       🔒 Permission check
    ===================================== */

    if (permissions.role !== "super_admin") {
      if (!permissions.allowedCompanyIds.includes(company_id)) {
        return NextResponse.json(
          { error: "Not authorized for this company" },
          { status: 403 },
        );
      }
    }

    /* =====================================
       👥 Get members
    ===================================== */

    const { data, error } = await supabase
      .from("company_members")
      .select(
        `
        id,
        role,
        profile_id,
        profiles (
          id,
          full_name,
          email,
          avatar_url
        )
      `,
      )
      .eq("company_id", company_id)
      .order("created_at", { ascending: true });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    const formatted =
      data?.map((m) => ({
        id: m.id,
        role: m.role,
        profile_id: m.profile_id,
        full_name: m.profiles?.full_name,
        email: m.profiles?.email,
        avatar_url: m.profiles?.avatar_url,
      })) || [];

    return NextResponse.json(formatted);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}

/* =====================================================
   ➕ ADD MEMBER
===================================================== */
export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = await getAllowedCompanyIds(userId);
    const body = await req.json();
    const { company_id, profile_id, role } = body;

    if (!company_id || !profile_id || !role)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    if (permissions.role !== "super_admin") {
      if (!permissions.allowedCompanyIds.includes(company_id)) {
        return NextResponse.json(
          { error: "Not authorized for this company" },
          { status: 403 },
        );
      }
    }

    const { error } = await supabase.from("company_members").insert({
      company_id,
      profile_id,
      role,
    });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}

/* =====================================================
   ✏️ UPDATE ROLE
===================================================== */
export async function PATCH(req) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = await getAllowedCompanyIds(userId);
    const body = await req.json();
    const { company_id, profile_id, role } = body;

    if (!company_id || !profile_id || !role)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    if (permissions.role !== "super_admin") {
      if (!permissions.allowedCompanyIds.includes(company_id)) {
        return NextResponse.json(
          { error: "Not authorized for this company" },
          { status: 403 },
        );
      }
    }

    const { error } = await supabase
      .from("company_members")
      .update({ role })
      .eq("company_id", company_id)
      .eq("profile_id", profile_id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}

/* =====================================================
   ❌ REMOVE MEMBER
===================================================== */
export async function DELETE(req) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = await getAllowedCompanyIds(userId);
    const body = await req.json();
    const { company_id, profile_id } = body;

    if (!company_id || !profile_id)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    if (permissions.role !== "super_admin") {
      if (!permissions.allowedCompanyIds.includes(company_id)) {
        return NextResponse.json(
          { error: "Not authorized for this company" },
          { status: 403 },
        );
      }
    }

    const { error } = await supabase
      .from("company_members")
      .delete()
      .eq("company_id", company_id)
      .eq("profile_id", profile_id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
