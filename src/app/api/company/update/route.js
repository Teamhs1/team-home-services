import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/utils/supabase/server";

export async function PATCH(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { logo_url } = await req.json();

    // 🔎 Get profile
    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("id, active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json({ error: "No active company" }, { status: 400 });
    }

    // 🔐 Ensure owner
    const { data: membership } = await supabaseServer
      .from("company_members")
      .select("role")
      .eq("company_id", profile.active_company_id)
      .eq("profile_id", profile.id)
      .single();

    if (!membership || membership.role !== "owner") {
      return NextResponse.json(
        { error: "Only owner can update company" },
        { status: 403 },
      );
    }

    // ✅ Update logo
    const { error } = await supabaseServer
      .from("companies")
      .update({ logo_url })
      .eq("id", profile.active_company_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update logo" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
