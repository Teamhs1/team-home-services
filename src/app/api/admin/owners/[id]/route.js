import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =========================
   GET OWNER (ADMIN / CLIENT)
========================= */
export async function GET(req, { params }) {
  try {
    const { userId } = await auth();
    const { id: ownerId } = params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔐 Perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // 🔍 Query base
    let query = supabase
      .from("owners")
      .select(
        `
    *,
    companies (
      id,
      name,
      email
    )
  `,
      )
      .eq("id", ownerId);

    // 🔒 Client solo puede ver owners de su company
    if (profile.role !== "admin") {
      query = query.eq("company_id", profile.company_id);
    }

    const { data: owner, error } = await query.single();

    if (error || !owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    return NextResponse.json({ owner });
  } catch (err) {
    console.error("❌ GET OWNER ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load owner" },
      { status: 500 },
    );
  }
}

/* =========================
   PATCH OWNER (ADMIN / CLIENT)
========================= */
export async function PATCH(req, { params }) {
  try {
    const { userId } = await auth();
    const { id: ownerId } = params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // 🧑 Perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // 🛑 Campos permitidos (evita updates peligrosos)
    const allowedFields = ["full_name", "email", "phone", "notes"];

    const updates = {};
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // 🔧 Update base
    let query = supabase.from("owners").update(updates).eq("id", ownerId);

    // 🔒 Client → solo su compañía
    if (profile.role !== "admin") {
      query = query.eq("company_id", profile.company_id);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ PATCH OWNER ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update owner" },
      { status: 500 },
    );
  }
}

/* =========================
   DELETE OWNER (ADMIN ONLY)
========================= */
export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth();
    const { id: ownerId } = params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("owners").delete().eq("id", ownerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE OWNER ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete owner" },
      { status: 500 },
    );
  }
}
