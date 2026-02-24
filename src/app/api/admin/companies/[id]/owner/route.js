import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(req, { params }) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { companyId } = params;

  if (!companyId) {
    return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
  }

  // 🔎 Obtener perfil del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("clerk_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 👑 Si no es super_admin, verificar que pertenezca a la company
  if (profile.role !== "super_admin") {
    const { data: membership } = await supabase
      .from("company_members")
      .select("id")
      .eq("company_id", companyId)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  /* =====================
     FIND OWNER FROM owners
  ===================== */
  const { data: owner, error } = await supabase
    .from("owners")
    .select("id, full_name")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("❌ OWNER LOOKUP ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    owner: owner || null,
  });
}
