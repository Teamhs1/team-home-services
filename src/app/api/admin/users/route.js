// /app/api/admin/users/route.js
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/utils/supabase/serverAdmin";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔎 Obtener perfil actual
  const { data: currentUser, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role, company_id")
    .eq("clerk_id", userId)
    .single();

  if (profileError || !currentUser) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // 👑 SUPER ADMIN → ve TODO
  if (currentUser.role === "super_admin") {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(
        `
        id,
        clerk_id,
        full_name,
        email,
        avatar_url,
        role,
        status,
        created_at,
        company_id,
        companies:company_id (
          id,
          name
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data });
  }

  // 🏢 ADMIN → solo su company
  if (currentUser.role === "admin") {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(
        `
        id,
        clerk_id,
        full_name,
        email,
        avatar_url,
        role,
        status,
        created_at,
        company_id,
        companies:company_id (
          id,
          name
        )
      `,
      )
      .eq("company_id", currentUser.company_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
