// src/app/api/companies/[id]/members/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   GET · LIST MEMBERS
========================= */
export async function GET(req, context) {
  try {
    const { id: companyId } = context.params;

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing company id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("company_members")
      .select(
        `
        id,
        role,
        profiles:profile_id (
          id,
          full_name,
          email
        )
      `
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("GET MEMBERS ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members: data });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* =========================
   POST · ADD MEMBER
========================= */
export async function POST(req, context) {
  try {
    const { id: companyId } = context.params;
    const { profile_id, role } = await req.json();

    if (!companyId || !profile_id || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ⛔ evitar duplicados
    const { data: exists } = await supabaseAdmin
      .from("company_members")
      .select("id")
      .eq("company_id", companyId)
      .eq("profile_id", profile_id)
      .maybeSingle();

    if (exists) {
      return NextResponse.json(
        { error: "User already belongs to this company" },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin.from("company_members").insert({
      company_id: companyId,
      profile_id,
      role,
    });

    if (error) {
      console.error("ADD MEMBER ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* =========================
   PATCH · UPDATE MEMBER ROLE ✅
========================= */
export async function PATCH(req, context) {
  try {
    const { id: companyId } = context.params;
    const { profile_id, role } = await req.json();

    if (!companyId || !profile_id || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("company_members")
      .update({ role })
      .eq("company_id", companyId)
      .eq("profile_id", profile_id);

    if (error) {
      console.error("UPDATE ROLE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* =========================
   DELETE · REMOVE MEMBER
========================= */
export async function DELETE(req, context) {
  try {
    const { id: companyId } = context.params;
    const { profile_id } = await req.json();

    if (!companyId || !profile_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("company_members")
      .delete()
      .eq("company_id", companyId)
      .eq("profile_id", profile_id);

    if (error) {
      console.error("REMOVE MEMBER ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
