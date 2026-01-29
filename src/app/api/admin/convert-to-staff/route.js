import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    /* ======================
       AUTH
    ====================== */
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { staffClerkId, companyId } = await req.json();

    if (!staffClerkId || !companyId) {
      return NextResponse.json(
        { error: "Missing staffClerkId or companyId" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    /* ======================
       VERIFY ADMIN
    ====================== */
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* ======================
       UPDATE PROFILE
    ====================== */
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: "staff",
        active_company_id: companyId,
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_id", staffClerkId);

    if (profileError) throw profileError;

    /* ======================
       COMPANY MEMBERS
    ====================== */
    await supabase.from("company_members").upsert(
      {
        clerk_id: staffClerkId,
        company_id: companyId,
        role: "staff",
      },
      { onConflict: "clerk_id,company_id" },
    );

    /* ======================
       STAFF PERMISSIONS (BASE)
    ====================== */
    await supabase.from("staff_permissions").upsert(
      {
        clerk_id: staffClerkId,
        company_id: companyId,
        can_view_properties: true,
        can_view_jobs: true,
        can_upload_photos: true,
        can_edit_jobs: false,
      },
      { onConflict: "clerk_id,company_id" },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ convert-to-staff error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
