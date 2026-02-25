import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔎 Obtener perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    /* =========================
       👑 SUPER ADMIN → VE TODO
    ========================= */
    if (profile.role === "super_admin") {
      const { data, error } = await supabase
        .from("properties")
        .select("id, address, company_id")
        .order("address");

      if (error) throw error;

      return NextResponse.json(data || []);
    }

    /* =========================
       🏢 OTROS ROLES
    ========================= */
    if (!profile.active_company_id) {
      return NextResponse.json({ error: "No active company" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("properties")
      .select("id, address")
      .eq("company_id", profile.active_company_id)
      .order("address");

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("Load properties error:", err);
    return NextResponse.json(
      { error: "Failed to load properties" },
      { status: 500 },
    );
  }
}
