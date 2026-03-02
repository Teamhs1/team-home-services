// /app/api/admin/users/route.js

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/utils/supabase/serverAdmin";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* =========================
       🔎 Obtener perfil actual
    ========================= */

    const { data: currentUser, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !currentUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const baseSelect = `
  id,
  clerk_id,
  full_name,
  email,
  avatar_url,
  role,
  status,
  created_at,
  company_members (
    role,
    company_id,
    companies (
      id,
      name
    )
  )
`;

    /* =========================
       👑 SUPER ADMIN → ve TODO
    ========================= */

    if (currentUser.role === "super_admin") {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select(baseSelect)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ users: data });
    }

    /* =========================
       🔎 Obtener company actual
    ========================= */

    if (!currentUser.company_id) {
      return NextResponse.json(
        { error: "User has no company assigned" },
        { status: 400 },
      );
    }

    const { data: currentCompany, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, company_type")
      .eq("id", currentUser.company_id)
      .single();

    if (companyError || !currentCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    /* =========================
       🏢 SERVICE PROVIDER LOGIC
    ========================= */

    if (currentCompany.company_type === "service_provider") {
      // 1️⃣ Obtener companies managed por este provider
      const { data: managedCompanies, error: managedError } =
        await supabaseAdmin
          .from("companies")
          .select("id")
          .eq("service_provider_id", currentCompany.id);

      if (managedError) {
        return NextResponse.json(
          { error: managedError.message },
          { status: 500 },
        );
      }

      const managedIds = managedCompanies?.map((c) => c.id) || [];

      // 2️⃣ Incluir su propia company también
      const allowedCompanyIds = [currentCompany.id, ...managedIds];

      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select(baseSelect)
        .in("company_members.company_id", allowedCompanyIds)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ users: data });
    }

    /* =========================
       🏢 ADMIN NORMAL → solo su company
    ========================= */

    if (currentUser.role === "admin") {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select(baseSelect)
        .eq("company_members.company_id", currentCompany.id)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ users: data });
    }

    /* =========================
       🚫 Everyone else blocked
    ========================= */

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (err) {
    console.error("❌ Users endpoint error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
