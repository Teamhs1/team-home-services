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

// 🧠 Sincroniza todos los usuarios de Clerk con Supabase
async function syncUsers() {
  const { data: allUsers } = await clerk.users.getUserList({ limit: 100 });
  const validRoles = ["admin", "staff", "client", "user"];
  const now = new Date().toISOString();

  for (const user of allUsers) {
    const email = user.emailAddresses?.[0]?.emailAddress || "unknown";
    let role = user.publicMetadata?.role;

    // 🧩 Si no tiene rol válido → se asigna "client" y se actualiza en Clerk
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

    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          clerk_id: user.id,
          full_name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          email,
          role,
          last_synced_at: now,
        },
        { onConflict: "clerk_id" }
      );

      if (error) throw error;

      await logSync({
        user_email: email,
        role,
        action: "upsert",
        status: "success",
        message: "User synced successfully",
      });

      console.log(`✅ Synced ${email} (${role})`);
    } catch (err) {
      await logSync({
        user_email: email,
        role,
        action: "upsert",
        status: "error",
        message: err.message,
      });
      console.error(`❌ Error syncing ${email}:`, err.message);
    }
  }
}

export async function POST() {
  try {
    await syncUsers();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Backfill error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
