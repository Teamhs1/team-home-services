import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const VALID_RESOURCES = [
  "jobs",
  "properties",
  "keys",
  "tenants",
  "expenses",
  "invoices",
];

const VALID_ACTIONS = ["view", "create", "edit", "delete"];

/* =========================
   GET PERMISSIONS
========================= */
export async function GET(req) {
  const { userId } = await auth();
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
    .select(
      `
      resource,
      can_view,
      can_create,
      can_edit,
      can_delete
    `,
    )
    .eq("staff_profile_id", staff_profile_id);

  if (error) {
    console.error("❌ Error loading permissions:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

/* =========================
   UPDATE PERMISSIONS
========================= */
export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const {
    staff_profile_id,
    resource,
    can_view, // 👈 compatibilidad actual
    action, // 👈 futuro
    value, // 👈 futuro
  } = body;

  const cleanResource = resource?.trim().toLowerCase();

  if (!staff_profile_id || !cleanResource) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!VALID_RESOURCES.includes(cleanResource)) {
    return NextResponse.json({ error: "Invalid resource" }, { status: 400 });
  }

  /* =========================
     NUEVO SISTEMA (ACTION)
  ========================= */
  if (action) {
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const column = `can_${action}`;

    const { error } = await supabase.from("staff_permissions").upsert(
      {
        staff_profile_id,
        resource: cleanResource,
        [column]: !!value,
      },
      { onConflict: ["staff_profile_id", "resource"] },
    );

    if (error) {
      console.error("❌ Error updating permission:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  /* =========================
     SISTEMA ACTUAL (can_view)
  ========================= */
  if (can_view === false) {
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

  const { error } = await supabase.from("staff_permissions").upsert(
    {
      staff_profile_id,
      resource: cleanResource,
      can_view: true,
    },
    { onConflict: ["staff_profile_id", "resource"] },
  );

  if (error) {
    console.error("❌ Error inserting permission:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, added: true });
}
