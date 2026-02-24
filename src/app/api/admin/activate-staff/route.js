import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { staffClerkId, companyId } = await req.json();

    if (!staffClerkId || !companyId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    /* =========================
       1️⃣ Obtener perfil del que llama
    ========================= */

    const { data: currentUser, error: currentError } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (currentError || !currentUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { role: callerRole, company_id: callerCompanyId } = currentUser;

    // Solo admin y super_admin pueden continuar
    if (!["admin", "super_admin"].includes(callerRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* =========================
       2️⃣ Obtener staff objetivo
    ========================= */

    const { data: targetUser, error: targetError } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("clerk_id", staffClerkId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 },
      );
    }

    // Solo se puede mover staff
    if (targetUser.role !== "staff") {
      return NextResponse.json(
        { error: "Only staff can be moved" },
        { status: 400 },
      );
    }

    /* =========================
       3️⃣ Restricción para admin normal
    ========================= */

    if (callerRole === "admin") {
      // admin solo puede mover staff de su misma company
      if (targetUser.company_id !== callerCompanyId) {
        return NextResponse.json(
          { error: "You can only move staff in your own company" },
          { status: 403 },
        );
      }

      // admin NO puede mover staff a otra company diferente
      if (companyId !== callerCompanyId) {
        return NextResponse.json(
          { error: "Admin cannot move staff to another company" },
          { status: 403 },
        );
      }
    }

    /* =========================
       4️⃣ Actualizar
    ========================= */

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        company_id: companyId,
        active_company_id: companyId,
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_id", staffClerkId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Move staff error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
