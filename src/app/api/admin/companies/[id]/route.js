import "server-only";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";

/* =====================
   GET COMPANY (DETAIL)
===================== */
export async function GET(req, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Company ID required" }, { status: 400 });
  }

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
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const owner =
    data.company_members.find((m) => m.role === "owner") ??
    data.company_members.find((m) => m.role === "admin") ??
    null;

  return NextResponse.json({
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    created_at: data.created_at,
    logo_url: data.logo_url,

    owner: owner?.profile || null,

    // 🔥 NORMALIZADO PARA EL FRONTEND
    members: data.company_members.map((m) => ({
      role: m.role,
      profile: {
        id: m.profile.id, // ✅ UUID
        full_name: m.profile.full_name,
        email: m.profile.email,
      },
    })),
  });
}

/* =====================
   DELETE COMPANY
===================== */
export async function DELETE(req, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Company ID required" }, { status: 400 });
  }

  /* 1️⃣ Verificar properties */
  const { data: properties } = await supabaseServer
    .from("properties")
    .select("id")
    .eq("company_id", id)
    .limit(1);

  if (properties?.length > 0) {
    return NextResponse.json(
      { error: "Company has properties and cannot be deleted" },
      { status: 400 },
    );
  }

  /* 2️⃣ Verificar miembros */
  const { data: members } = await supabaseServer
    .from("company_members")
    .select("id")
    .eq("company_id", id);

  if ((members?.length ?? 0) > 1) {
    return NextResponse.json(
      { error: "Company has multiple members and cannot be deleted" },
      { status: 400 },
    );
  }

  /* 3️⃣ Borrar relaciones */
  await supabaseServer.from("company_members").delete().eq("company_id", id);

  /* 4️⃣ Borrar company */
  const { error: deleteError } = await supabaseServer
    .from("companies")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
