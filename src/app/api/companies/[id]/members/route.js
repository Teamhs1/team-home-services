import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =========================
   CONSTANTES
========================= */
const BASE_STAFF_PERMISSIONS = [
  "jobs",
  "properties",
  "keys",
  "tenants",
  "expenses",
  "company",
];

/* =========================
   GET · LIST MEMBERS
========================= */
export async function GET(req, context) {
  try {
    const { id: companyId } = context.params;

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Missing company id" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("company_members")
      .select(
        `
        id,
        role,
        profile:profile_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `,
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("GET MEMBERS ERROR:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
/* =========================
   POST · ADD MEMBER ✅
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
        { status: 409 },
      );
    }

    // 1️⃣ insertar membresía
    const { error: insertError } = await supabaseAdmin
      .from("company_members")
      .insert({
        company_id: companyId,
        profile_id,
        role,
      });

    if (insertError) {
      console.error("ADD MEMBER ERROR:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 2️⃣ activar contexto
    await supabaseAdmin
      .from("profiles")
      .update({
        active_company_id: companyId,
        status: "active",
      })
      .eq("id", profile_id);

    // 3️⃣ 🔥 CREAR PERMISOS BASE (solo si no es owner)
    if (role !== "owner") {
      const permissionsPayload = BASE_STAFF_PERMISSIONS.map((resource) => ({
        staff_profile_id: profile_id,
        resource,
      }));

      const { error: permError } = await supabaseAdmin
        .from("staff_permissions")
        .insert(permissionsPayload);

      if (permError) {
        console.error("STAFF PERMISSIONS ERROR:", permError);
        // ⚠️ NO rompe el flujo
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* =========================
   PATCH · UPDATE MEMBER ROLE
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
   DELETE · REMOVE MEMBER ✅
========================= */
export async function DELETE(req, context) {
  try {
    const { id: companyId } = context.params;
    const { profile_id } = await req.json();

    if (!companyId || !profile_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1️⃣ eliminar permisos
    await supabaseAdmin
      .from("staff_permissions")
      .delete()
      .eq("staff_profile_id", profile_id);

    // 2️⃣ eliminar membresía
    const { error: deleteError } = await supabaseAdmin
      .from("company_members")
      .delete()
      .eq("company_id", companyId)
      .eq("profile_id", profile_id);

    if (deleteError) {
      console.error("REMOVE MEMBER ERROR:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 3️⃣ limpiar contexto
    await supabaseAdmin
      .from("profiles")
      .update({
        active_company_id: null,
        status: "inactive",
      })
      .eq("id", profile_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
