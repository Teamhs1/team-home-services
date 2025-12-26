import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 🔒 SOLO SERVER
);

export async function POST(req) {
  try {
    /* =============================
       AUTH
    ============================= */
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* =============================
       BODY
       {
         staff_clerk_id: string,
         target_company_id: string
       }
    ============================= */
    const { staff_clerk_id, target_company_id } = await req.json();

    if (!staff_clerk_id || !target_company_id) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    /* =============================
       VERIFY REQUESTER IS ADMIN
    ============================= */
    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (adminError || !adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* =============================
       VERIFY TARGET USER IS STAFF
    ============================= */
    const { data: staffProfile, error: staffError } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", staff_clerk_id)
      .single();

    if (staffError || !staffProfile) {
      return NextResponse.json(
        { error: "Staff profile not found" },
        { status: 404 }
      );
    }

    if (staffProfile.role !== "staff") {
      return NextResponse.json(
        { error: "Target user is not staff" },
        { status: 400 }
      );
    }

    /* =============================
       MOVE STAFF TO COMPANY
    ============================= */
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        company_id: target_company_id,
        active_company_id: null, // 🧠 staff no usa context switching
      })
      .eq("clerk_id", staff_clerk_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Staff moved to company successfully",
    });
  } catch (err) {
    s;
    console.error("❌ Move staff error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
