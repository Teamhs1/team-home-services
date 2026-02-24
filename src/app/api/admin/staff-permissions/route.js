import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

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
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getAllowedCompanyIds(userId);

    const { searchParams } = new URL(req.url);
    const staff_profile_id = searchParams.get("staff_profile_id");

    if (!staff_profile_id) {
      return NextResponse.json([], { status: 200 });
    }

    // 🔎 Obtener perfil actual
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (
      currentProfile?.role !== "admin" &&
      currentProfile?.role !== "super_admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🔎 Obtener perfil target
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", staff_profile_id)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // 🔐 Validar multi-tenant
    if (
      !permissions.isSuperAdmin &&
      !permissions.allowedCompanyIds.includes(targetProfile.company_id)
    ) {
      return NextResponse.json(
        { error: "Not authorized for this company" },
        { status: 403 },
      );
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}

/* =========================
   UPDATE PERMISSIONS
========================= */
export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getAllowedCompanyIds(userId);

    const body = await req.json();

    const { staff_profile_id, resource, action, value } = body;

    const cleanResource = resource?.trim().toLowerCase();

    if (!staff_profile_id || !cleanResource) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!VALID_RESOURCES.includes(cleanResource)) {
      return NextResponse.json({ error: "Invalid resource" }, { status: 400 });
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // 🔎 Perfil actual
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (
      currentProfile?.role !== "admin" &&
      currentProfile?.role !== "super_admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🔎 Perfil target
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", staff_profile_id)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // 🔐 Multi-tenant check
    if (
      !permissions.isSuperAdmin &&
      !permissions.allowedCompanyIds.includes(targetProfile.company_id)
    ) {
      return NextResponse.json(
        { error: "Not authorized for this company" },
        { status: 403 },
      );
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
