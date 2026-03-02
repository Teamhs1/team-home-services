import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, phone, notes } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 },
      );
    }

    /* ================================
       1️⃣ GET PROFILE
    ================================= */

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id, active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileErr || !profile) {
      console.error("PROFILE ERROR:", profileErr);
      return NextResponse.json({ error: "Profile not found" }, { status: 500 });
    }

    // 🚨 Prevent multiple companies if needed
    if (profile.active_company_id) {
      return NextResponse.json(
        { error: "User already has an active company" },
        { status: 400 },
      );
    }

    /* ================================
       2️⃣ CREATE COMPANY
    ================================= */

    const { data: company, error: companyErr } = await supabaseAdmin
      .from("companies")
      .insert({
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        notes: notes || null,
        created_by: profile.id,

        // 🔥 default free plan
        plan_type: "free",
        subscription_status: null,
        billing_enabled: false,
        max_units: 1,
      })
      .select()
      .single();

    if (companyErr) {
      console.error("COMPANY INSERT ERROR:", companyErr);
      return NextResponse.json(
        { error: "Failed to create company" },
        { status: 500 },
      );
    }

    /* ================================
       3️⃣ ASSIGN OWNER
    ================================= */

    const { error: memberErr } = await supabaseAdmin
      .from("company_members")
      .insert({
        company_id: company.id,
        profile_id: profile.id,
        role: "owner", // 🔥 important
      });

    if (memberErr) {
      console.error("MEMBER INSERT ERROR:", memberErr);
      return NextResponse.json(
        { error: "Company created but failed to assign owner" },
        { status: 500 },
      );
    }

    /* ================================
       4️⃣ UPDATE PROFILE ACTIVE COMPANY
    ================================= */

    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({
        active_company_id: company.id,
        company_id: company.id, // optional if you use it
      })
      .eq("id", profile.id);

    if (updateErr) {
      console.error("PROFILE UPDATE ERROR:", updateErr);
      return NextResponse.json(
        { error: "Company created but failed to activate workspace" },
        { status: 500 },
      );
    }

    /* ================================
       ✅ SUCCESS
    ================================= */

    return NextResponse.json({
      success: true,
      company_id: company.id,
    });
  } catch (err) {
    console.error("CREATE COMPANY API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
