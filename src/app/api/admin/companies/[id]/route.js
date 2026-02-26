import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/utils/supabase/server";

/* =========================================================
   GET COMPANY (DETAIL)
========================================================= */
export async function GET(req, context) {
  try {
    const { id } = context.params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Company ID required" },
        { status: 400 },
      );
    }

    /* =====================
       GET CURRENT PROFILE
    ===================== */
    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("id, role")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    /* =====================
       MULTI-TENANT CHECK
    ===================== */
    if (profile.role !== "super_admin") {
      const { data: membership } = await supabaseServer
        .from("company_members")
        .select("id")
        .eq("company_id", id)
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json(
          { success: false, message: "Forbidden" },
          { status: 403 },
        );
      }
    }

    /* =====================
       FETCH COMPANY
    ===================== */
    const { data, error } = await supabaseServer
      .from("companies")
      .select(
        `
        id,
        name,
        email,
        phone,
        logo_url,
        created_at,
        company_members (
          role,
          profile:profiles (
            id,
            clerk_id,
            full_name,
            email
          )
        )
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 },
      );
    }

    const membersArray = Array.isArray(data.company_members)
      ? data.company_members
      : [];

    const owner =
      membersArray.find((m) => m.role === "owner") ??
      membersArray.find((m) => m.role === "admin") ??
      null;

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        created_at: data.created_at,
        logo_url: data.logo_url,
        owner: owner?.profile || null,
        members: membersArray.map((m) => ({
          role: m.role,
          profile: {
            id: m.profile?.id || null,
            clerk_id: m.profile?.clerk_id || null, //
            full_name: m.profile?.full_name || null,
            email: m.profile?.email || null,
          },
        })),
      },
    });
  } catch (err) {
    console.error("GET COMPANY crash:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

/* =========================================================
   DELETE COMPANY
========================================================= */
export async function DELETE(req, context) {
  try {
    const { id } = context.params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Company ID required" },
        { status: 400 },
      );
    }

    /* =====================
       VERIFY SUPER ADMIN
    ===================== */
    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (profileError || profile?.role !== "super_admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    /* =====================
       CHECK PROPERTIES
    ===================== */
    const { data: properties, error: propError } = await supabaseServer
      .from("properties")
      .select("id")
      .eq("company_id", id)
      .limit(1);

    if (propError) {
      return NextResponse.json(
        { success: false, message: propError.message },
        { status: 500 },
      );
    }

    if (properties && properties.length > 0) {
      return NextResponse.json(
        { success: false, message: "Company has properties" },
        { status: 400 },
      );
    }

    /* =====================
       CHECK MEMBERS
    ===================== */
    const { data: members, error: memberError } = await supabaseServer
      .from("company_members")
      .select("id")
      .eq("company_id", id);

    if (memberError) {
      return NextResponse.json(
        { success: false, message: memberError.message },
        { status: 500 },
      );
    }

    if ((members?.length ?? 0) > 1) {
      return NextResponse.json(
        { success: false, message: "Company has multiple members" },
        { status: 400 },
      );
    }

    /* =====================
       DELETE RELATIONS
    ===================== */
    await supabaseServer.from("company_members").delete().eq("company_id", id);

    /* =====================
       DELETE COMPANY
    ===================== */
    const { error: deleteError } = await supabaseServer
      .from("companies")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, message: deleteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE COMPANY crash:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
