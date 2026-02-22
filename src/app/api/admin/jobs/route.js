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

    // 🔐 Obtener perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 🔐 Validar rol admin o super_admin
    if (!isAdminRole(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 📦 Obtener trabajos
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
      console.error("❌ Supabase error:", error);
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
