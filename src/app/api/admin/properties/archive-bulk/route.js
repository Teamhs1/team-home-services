import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =========================
   BULK ARCHIVE / RESTORE
========================= */
export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids, is_active } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    let permissions;

    try {
      permissions = await getAllowedCompanyIds(userId);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const { role, allowedCompanyIds } = permissions;

    /* =========================
       👑 SUPER ADMIN → puede todo
    ========================= */

    if (role === "super_admin") {
      const { error } = await supabase
        .from("properties")
        .update({ is_active })
        .in("id", ids);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        updated: ids.length,
        is_active,
      });
    }

    /* =========================
       🔐 VALIDATE OWNERSHIP
    ========================= */

    // 1️⃣ Traer propiedades para validar company
    const { data: properties, error: fetchError } = await supabase
      .from("properties")
      .select("id, company_id")
      .in("id", ids);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // 2️⃣ Filtrar solo las que pertenecen a companies permitidas
    const validIds =
      properties
        ?.filter((p) => allowedCompanyIds.includes(p.company_id))
        .map((p) => p.id) || [];

    if (validIds.length === 0) {
      return NextResponse.json(
        { error: "Not authorized for these properties" },
        { status: 403 },
      );
    }

    // 3️⃣ Update solo las válidas
    const { error: updateError } = await supabase
      .from("properties")
      .update({ is_active })
      .in("id", validIds);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated: validIds.length,
      is_active,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 },
    );
  }
}
