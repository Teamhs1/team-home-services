// /api/admin/jobs/route.js

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function isAdminRole(role) {
  return ["admin", "super_admin"].includes(role);
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* =========================
       🔐 Obtener perfil
    ========================= */

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!isAdminRole(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* =========================
       👑 SUPER ADMIN → ve TODO
    ========================= */

    if (profile.role === "super_admin") {
      const { data, error } = await supabase
        .from("cleaning_jobs")
        .select(
          `
          id,
          title,
          status,
          service_type,
          property_address,
          scheduled_date,
          started_at,
          completed_at,
          duration_minutes,
          assigned_to,
          client_profile_id,
          company_id,
          created_at,
          staff:profiles!cleaning_jobs_assigned_to_fkey (
            clerk_id,
            full_name,
            email
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data || []);
    }

    /* =========================
       🔎 Obtener company actual
    ========================= */

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, company_type")
      .eq("id", profile.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    let allowedCompanyIds = [company.id];

    /* =========================
       🏗 SERVICE PROVIDER
    ========================= */

    if (company.company_type === "service_provider") {
      const { data: managedCompanies, error: managedError } = await supabase
        .from("companies")
        .select("id")
        .eq("service_provider_id", company.id);

      if (managedError) {
        return NextResponse.json(
          { error: managedError.message },
          { status: 500 },
        );
      }

      const managedIds = managedCompanies?.map((c) => c.id) || [];

      allowedCompanyIds = [company.id, ...managedIds];
    }

    /* =========================
       📦 Obtener jobs filtrados
    ========================= */

    const { data, error } = await supabase
      .from("cleaning_jobs")
      .select(
        `
        id,
        title,
        status,
        service_type,
        property_address,
        scheduled_date,
        started_at,
        completed_at,
        duration_minutes,
        assigned_to,
        client_profile_id,
        company_id,
        created_at,
        staff:profiles!cleaning_jobs_assigned_to_fkey (
          clerk_id,
          full_name,
          email
        )
      `,
      )
      .in("company_id", allowedCompanyIds)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
