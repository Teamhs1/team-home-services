import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* =====================
       LOAD PROFILE
    ===================== */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      console.error("❌ PROFILE ERROR:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    /* =====================
       READ QUERY PARAM
    ===================== */
    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get("company_id");
    const clientIdParam = searchParams.get("client_id"); // ✅ NUEVO

    /* =====================
       LOAD PROPERTIES
       ✅ Owner incluido
       ✅ Seguro si owner_id es null
    ===================== */
    let query = supabase
      .from("properties")
      .select(
        `
        id,
        name,
        address,
        unit,
        company_id,
        owner_id,
        owners:owner_id (
          id,
          full_name
        ),
        companies:company_id (
          id,
          name
        )
      `
      )
      .eq("is_active", true)
      .order("address", { ascending: true }) // 🧠 mejor orden visual
      .order("name", { ascending: true });

    /* 🔐 Non-admins: force active company */
    if (profile.role !== "admin") {
      query = query.eq("company_id", profile.active_company_id);
    }

    /* 🧠 Admin + selector */
    if (profile.role === "admin" && companyIdParam) {
      query = query.eq("company_id", companyIdParam);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ SUPABASE QUERY ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ✅ Siempre devolvemos array (aunque no haya owner)
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("💥 API CRASH:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
