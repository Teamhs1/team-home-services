import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server"; // ✅ Actualizado
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // 🔹 Asegura entorno Node

// 🧩 Supabase con clave privada (solo para servidor)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    // ✅ Autenticación Clerk
    const { userId } = getAuth(req);

    if (!userId) {
      console.warn("🚫 Unauthorized: no Clerk session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔍 Obtener usuario y rol desde Clerk
    const user = await clerkClient.users.getUser(userId);
    const role = user?.publicMetadata?.role || "user";

    if (role !== "admin") {
      console.warn(`🚫 Access denied: user ${userId} (${role})`);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 📦 Leer contenido del body
    const { about, services } = await req.json();

    if (!about && !services) {
      return NextResponse.json(
        { error: "Missing about or services content" },
        { status: 400 }
      );
    }

    // 🔄 Actualizar contenido en Supabase
    const updates = [];

    if (about) {
      updates.push(
        supabase
          .from("site_content")
          .update({ content: about })
          .eq("section", "about")
          .select()
      );
    }

    if (services) {
      updates.push(
        supabase
          .from("site_content")
          .update({ content: { items: services } })
          .eq("section", "services")
          .select()
      );
    }

    const results = await Promise.all(updates);
    const errors = results.map((r) => r.error).filter(Boolean);
    if (errors.length > 0) throw errors[0];

    // ✅ Éxito
    return NextResponse.json({
      success: true,
      message: "Content updated successfully",
    });
  } catch (err) {
    console.error("❌ API Error:", err.message);
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
