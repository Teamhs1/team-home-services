import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

// ⚠️ Usa SERVICE ROLE porque modificas datos protegidos por RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Solo estos recursos son válidos en el sidebar
const VALID_RESOURCES = ["jobs", "properties", "keys", "tenants"];

/* =========================
   GET PERMISSIONS FOR ADMIN UI
========================= */
export async function GET(req) {
  const { userId } = await auth(); // ✅ validar auth

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const staff_profile_id = searchParams.get("staff_profile_id");

  if (!staff_profile_id) {
    return NextResponse.json([], { status: 200 });
  }

  const { data, error } = await supabase
    .from("staff_permissions")
    .select("resource")
    .eq("staff_profile_id", staff_profile_id);

  if (error) {
    console.error("❌ Error loading permissions:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/* =========================
   TOGGLE PERMISSION (Insert/Delete)
========================= */
export async function POST(req) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { staff_profile_id, resource, can_view } = await req.json();

  const cleanResource = resource?.trim().toLowerCase();

  if (!staff_profile_id || !cleanResource) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!VALID_RESOURCES.includes(cleanResource)) {
    return NextResponse.json({ error: "Invalid resource" }, { status: 400 });
  }

  if (can_view === false) {
    // ❌ quitar permiso
    const { error } = await supabase
      .from("staff_permissions")
      .delete()
      .eq("staff_profile_id", staff_profile_id)
      .eq("resource", cleanResource);

    if (error) {
      console.error("❌ Error deleting permission:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, removed: true });
  }

  // ✅ insertar permiso con upsert (evita duplicados)
  const { error } = await supabase
    .from("staff_permissions")
    .upsert(
      { staff_profile_id, resource: cleanResource },
      { onConflict: ["staff_profile_id", "resource"] }
    );

  if (error) {
    console.error("❌ Error inserting permission:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, added: true });
}
