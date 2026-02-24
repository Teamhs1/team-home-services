// src/app/api/admin/set-role/route.js

import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { targetId, newRole } = await req.json();

    if (!targetId || !newRole) {
      return NextResponse.json(
        { error: "Missing targetId or newRole" },
        { status: 400 },
      );
    }

    // 🔐 Obtener permisos actuales
    const permissions = await getAllowedCompanyIds(userId);

    // 🔎 Perfil actual
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (!currentProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 🔎 Perfil target
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", targetId)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    /* =============================
       🚫 BLOQUEOS IMPORTANTES
    ============================= */

    // ❌ No permitir cambiarse a sí mismo
    if (userId === targetId) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 403 },
      );
    }

    // ❌ Admin NO puede crear super_admin
    if (!permissions.isSuperAdmin && newRole === "super_admin") {
      return NextResponse.json(
        { error: "Only super_admin can assign this role" },
        { status: 403 },
      );
    }

    /* =============================
       👑 SUPER ADMIN
    ============================= */

    if (permissions.isSuperAdmin) {
      // allowed global
    } else {
      /* =============================
       🏢 ADMIN NORMAL
    ============================= */
      // Debe pertenecer a misma company
      if (!permissions.allowedCompanyIds.includes(targetProfile.company_id)) {
        return NextResponse.json(
          { error: "Not authorized for this company" },
          { status: 403 },
        );
      }
    }

    /* =============================
       ✅ ACTUALIZAR
    ============================= */

    // Clerk metadata
    await clerkClient.users.updateUserMetadata(targetId, {
      publicMetadata: { role: newRole },
    });

    // Supabase profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("clerk_id", targetId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update role in Supabase" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
