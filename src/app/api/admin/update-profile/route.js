import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server"; // ✅ más estable en Next 15

// 🧠 Servidor con Service Role Key (sin restricciones RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    // 🔐 Verificar sesión actual de Clerk
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 📋 Obtener el rol del usuario actual desde la tabla profiles
    const { data: currentProfile, error: roleError } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", user.id)
      .single();

    if (roleError) {
      console.error("Role fetch error:", roleError.message);
      return NextResponse.json({ error: "Role check failed" }, { status: 500 });
    }

    // 🔒 Solo permitir a administradores
    if (currentProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 📦 Datos enviados desde el cliente
    const { id, updates } = await req.json();

    if (!id || !updates) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    // 🧾 Actualizar perfil con Service Role Key (sin RLS)
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id);
    if (error) throw error;

    return NextResponse.json(
      { message: "Profile updated successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Update error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
