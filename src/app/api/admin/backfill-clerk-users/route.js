// src/app/api/admin/backfill-clerk-users/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClerkClient } from "@clerk/backend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// 🧩 Registrar logs en Supabase
async function logSync({ user_email, role, action, status, message }) {
  await supabase.from("sync_logs").insert({
    user_email,
    role,
    action,
    status,
    message,
  });
}

// 🧠 Sincroniza todos los usuarios de Clerk con Supabase (IDEMPOTENTE)
async function syncUsers() {
  const { data: allUsers } = await clerk.users.getUserList({ limit: 100 });
  const validRoles = ["admin", "staff", "client", "user"];
  const now = new Date().toISOString();

  let scanned = 0;
  let updated = 0;

  for (const user of allUsers) {
    scanned++;

    const email = user.emailAddresses?.[0]?.emailAddress || "unknown";
    let role = user.publicMetadata?.role;

    // 🧩 Rol por defecto si no es válido
    if (!role || !validRoles.includes(role)) {
      role = "client";
      console.log(`⚙️ Asignando rol 'client' a ${email}`);

      try {
        await clerk.users.updateUserMetadata(user.id, {
          publicMetadata: { role },
        });
      } catch (clerkError) {
        console.warn(
          `⚠️ No se pudo actualizar rol en Clerk: ${clerkError.message}`
        );
      }
    }

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    try {
      // 🔍 Obtener perfil actual
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("clerk_id", user.id)
        .single();

      // 🧠 Comparar cambios reales
      const hasChanges =
        !existingProfile ||
        existingProfile.full_name !== fullName ||
        existingProfile.email !== email ||
        existingProfile.role !== role;

      if (hasChanges) {
        const { error } = await supabase.from("profiles").upsert(
          {
            clerk_id: user.id,
            full_name: fullName,
            email,
            role,
            last_synced_at: now,
          },
          { onConflict: "clerk_id" }
        );

        if (error) throw error;

        updated++;

        await logSync({
          user_email: email,
          role,
          action: "update",
          status: "success",
          message: "User data updated from Clerk",
        });

        console.log(`🔄 Updated ${email} (${role})`);
      } else {
        console.log(`⏭️ No changes for ${email}`);
      }
    } catch (err) {
      await logSync({
        user_email: email,
        role,
        action: "update",
        status: "error",
        message: err.message,
      });

      console.error(`❌ Error syncing ${email}:`, err.message);
    }
  }

  return { scanned, updated };
}

export async function POST() {
  try {
    const result = await syncUsers();

    return NextResponse.json({
      success: true,
      scanned: result.scanned,
      updated: result.updated,
    });
  } catch (err) {
    console.error("❌ Backfill error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
