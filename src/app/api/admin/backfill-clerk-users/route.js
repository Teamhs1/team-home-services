// src/app/api/admin/backfill-clerk-users/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClerkClient } from "@clerk/backend";
import { auth } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// 🧩 Registrar logs
async function logSync({ user_email, role, action, status, message }) {
  await supabase.from("sync_logs").insert({
    user_email,
    role,
    action,
    status,
    message,
  });
}

async function syncUsers() {
  const { data: allUsers } = await clerk.users.getUserList({ limit: 100 });

  const validRoles = ["super_admin", "admin", "staff", "client"];
  const now = new Date().toISOString();

  let scanned = 0;
  let updated = 0;

  for (const user of allUsers) {
    scanned++;

    const email = user.emailAddresses?.[0]?.emailAddress || "unknown";
    let clerkRole = user.publicMetadata?.role;

    if (!clerkRole || !validRoles.includes(clerkRole)) {
      clerkRole = "client";
    }

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    try {
      // 🔎 Obtener perfil actual en Supabase
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("clerk_id", user.id)
        .single();

      let finalRole = clerkRole;

      // 🛡️ PROTECCIÓN ABSOLUTA:
      // Si el usuario YA es super_admin en Supabase,
      // jamás lo degradamos aunque Clerk diga otra cosa.
      if (existingProfile?.role === "super_admin") {
        finalRole = "super_admin";
      }

      const hasChanges =
        !existingProfile ||
        existingProfile.full_name !== fullName ||
        existingProfile.email !== email ||
        existingProfile.role !== finalRole;

      if (hasChanges) {
        const { error } = await supabase.from("profiles").upsert(
          {
            clerk_id: user.id,
            full_name: fullName,
            email,
            role: finalRole,
            last_synced_at: now,
          },
          { onConflict: "clerk_id" },
        );

        if (error) throw error;

        updated++;

        await logSync({
          user_email: email,
          role: finalRole,
          action: "update",
          status: "success",
          message: "User data synced from Clerk",
        });
      }
    } catch (err) {
      await logSync({
        user_email: email,
        role: clerkRole,
        action: "update",
        status: "error",
        message: err.message,
      });
    }
  }

  return { scanned, updated };
}

/* ===============================
   🔐 PROTECTED ENDPOINT
=============================== */

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔎 Validar rol REAL desde Supabase
    const { data: currentUser } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (!currentUser || currentUser.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super_admin can run full sync" },
        { status: 403 },
      );
    }

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
