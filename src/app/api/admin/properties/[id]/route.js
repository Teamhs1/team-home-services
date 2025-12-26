// app/api/properties/[id]/route.js
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function DELETE(req, { params }) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1️⃣ Perfil real
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (!profile || !profile.company_id) {
      return NextResponse.json(
        { error: "No company assigned" },
        { status: 403 }
      );
    }

    // 2️⃣ Permiso REAL (RBAC)
    const { data: permission } = await supabase
      .from("permissions_matrix")
      .select("allowed")
      .eq("company_id", profile.company_id)
      .eq("role", profile.role)
      .eq("resource", "property") // ✅ singular
      .eq("action", "delete")
      .maybeSingle();

    if (!permission?.allowed) {
      return NextResponse.json(
        { error: "Not allowed to delete properties" },
        { status: 403 }
      );
    }

    const propertyId = params.id;

    // 👉 aquí luego puedes validar dependencias (jobs, keys, etc.)

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId)
      .eq("company_id", profile.company_id); // 🔐 seguridad extra

    if (error) {
      console.error("DELETE PROPERTY ERROR:", error);
      return NextResponse.json(
        { error: "Failed to delete property" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE PROPERTY ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
