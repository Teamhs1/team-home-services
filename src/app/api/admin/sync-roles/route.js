import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST() {
  try {
    // 🔐 1️⃣ Verificar autenticación
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔎 2️⃣ Verificar que quien ejecuta sea super_admin
    const { data: currentUser, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !currentUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (currentUser.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 },
      );
    }

    console.log("🚀 SUPER ADMIN syncing users...");

    // 🔹 3️⃣ Obtener usuarios desde Clerk
    const res = await fetch("https://api.clerk.dev/v1/users", {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { message: "Failed to fetch users", details: errText },
        { status: 500 },
      );
    }

    const users = await res.json();

    for (const u of users) {
      const clerk_id = u.id;
      if (!clerk_id) continue;

      const email = u.email_addresses?.[0]?.email_address || null;
      const full_name =
        `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—";
      const avatar_url = u.image_url || null;

      // 🔎 Buscar perfil existente
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("clerk_id", clerk_id)
        .maybeSingle();

      // 🛑 NUNCA sobreescribir super_admin
      let finalRole;

      if (existingProfile?.role === "super_admin") {
        finalRole = "super_admin";
      } else if (existingProfile) {
        // Mantener rol actual si ya existe
        finalRole = existingProfile.role;
      } else {
        // Si es nuevo usuario → usar Clerk metadata
        finalRole = u.public_metadata?.role || "client";
      }

      if (existingProfile) {
        // 🔄 Actualizar datos básicos (NO rol si es super_admin)
        const { error } = await supabase
          .from("profiles")
          .update({
            email,
            full_name,
            avatar_url,
            role: finalRole,
          })
          .eq("clerk_id", clerk_id);

        if (error) {
          console.error(`❌ Error updating ${email}:`, error.message);
        } else {
          console.log(`✅ Updated ${email} → ${finalRole}`);
        }
      } else {
        // 🆕 Insertar nuevo usuario
        const { error } = await supabase.from("profiles").insert([
          {
            clerk_id,
            email,
            full_name,
            avatar_url,
            role: finalRole,
            status: "active",
          },
        ]);

        if (error) {
          console.error(`❌ Error inserting ${email}:`, error.message);
        } else {
          console.log(`🆕 Created ${email} → ${finalRole}`);
        }
      }
    }

    return NextResponse.json(
      { message: "Users synced successfully!" },
      { status: 200 },
    );
  } catch (err) {
    console.error("❌ Sync error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
