// src/app/api/admin/staff/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 🔎 Obtener perfil actual
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.role === "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* =====================================
       🔥 CONSULTA REAL
    ===================================== */

    let query = supabase
      .from("company_members")
      .select(
        `
        id,
        role,
        company_id,
        companies (
          id,
          name
        ),
        profiles (
          id,
          full_name,
          email,
          clerk_id
        )
      `,
      )
      .in("role", ["staff", "maintenance_staff", "leasing_manager"])
      .order("profiles(full_name)");

    // 👑 SUPER ADMIN → ve todo
    if (profile.role !== "super_admin") {
      query = query.eq("company_id", profile.company_id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const unique = new Map();

    (data || []).forEach((m) => {
      const clerkId = m.profiles?.clerk_id;
      if (!clerkId) return;

      if (!unique.has(clerkId)) {
        unique.set(clerkId, {
          id: m.profiles.id,
          clerk_id: clerkId,
          full_name: m.profiles.full_name,
          email: m.profiles.email,
          role: m.role,
          company_id: m.company_id,
          company_name: m.companies?.name,
        });
      }
    });

    return NextResponse.json(Array.from(unique.values()));
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
