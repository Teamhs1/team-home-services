import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 🚀 Crear Job (sin JWT, sin Clerk, sin RLS)
 */
export async function POST(req) {
  try {
    console.log("🟢 /api/jobs/create called...");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { title, service_type, assigned_to, scheduled_date, created_by } =
      body;

    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    // 🔍 Buscar el rol del usuario en profiles (si existe)
    let created_by_role = "unknown";
    if (created_by) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("clerk_id", created_by)
        .single();

      if (profileError) {
        console.warn(
          "⚠️ No se encontró perfil o error al consultar role:",
          profileError.message
        );
      } else if (profile?.role) {
        created_by_role = profile.role;
      }
    }

    // 🧩 Insertar nuevo job
    const { data, error } = await supabase
      .from("cleaning_jobs")
      .insert([
        {
          title,
          service_type: service_type || "general",
          assigned_to: assigned_to || null,
          scheduled_date: scheduled_date || null,
          status: "pending",
          created_by: created_by || "system",
        },
      ])
      .select();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(
      `✅ Job '${title}' created successfully by ${created_by} (${created_by_role})`
    );

    return NextResponse.json({
      message: "Job created successfully",
      data: [
        {
          ...data[0],
          created_by_role, // ✅ incluimos el rol del creador
        },
      ],
    });
  } catch (err) {
    console.error("💥 Error creating job:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
