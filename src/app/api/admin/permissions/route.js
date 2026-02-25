// /api/admin/permissions/route.js
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* ======================================================
   CONSTANTS
====================================================== */
const ALLOWED_ROLES = ["admin", "staff", "client_manager", "client_basic"];

const ALLOWED_RESOURCES = [
  "properties",
  "jobs",
  "tenants",
  "keys",
  "users",
  "companies",
  "permissions",
  "invoices",
];

const ALLOWED_ACTIONS = ["view", "create", "edit", "delete"];

const RESOURCE_ALIASES = {
  permission: "permissions",
  perms: "permissions",
  company: "companies",
  user: "users",
  property: "properties",
  invoice: "invoices",
};

/* ======================================================
   HELPERS
====================================================== */
function normalize(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

function normalizeResource(resource) {
  const r = normalize(resource);
  return RESOURCE_ALIASES[r] || r;
}

async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, company_id")
    .eq("clerk_id", userId)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    role: normalize(data.role),
  };
}

async function getFirstCompanyId() {
  const { data } = await supabase
    .from("companies")
    .select("id")
    .limit(1)
    .single();

  return data?.id || null;
}

/* ======================================================
   GET · READ PERMISSIONS
====================================================== */
export async function GET(req) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const role = normalize(searchParams.get("role") || "staff");

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role", role }, { status: 400 });
  }

  let company_id;

  if (profile.role === "super_admin") {
    // 👇 super admin toma la primera company del sistema
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .limit(1)
      .single();

    if (!company) {
      return NextResponse.json(
        { error: "No companies found" },
        { status: 400 },
      );
    }

    company_id = company.id;
  } else if (profile.role === "admin") {
    company_id = profile.company_id;
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("permissions_matrix")
    .select("resource, action, allowed")
    .eq("company_id", company_id)
    .eq("role", role);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const matrix = {};

  for (const row of data) {
    if (!matrix[row.resource]) matrix[row.resource] = {};
    matrix[row.resource][row.action] = Boolean(row.allowed);
  }

  return NextResponse.json({
    company_id,
    role,
    matrix,
  });
}

/* ======================================================
   POST · UPDATE PERMISSION
====================================================== */
export async function POST(req) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let { company_id, role, resource, action, allowed } = body;

  role = normalize(role);
  action = normalize(action);
  resource = normalizeResource(resource);

  if (
    !company_id ||
    !role ||
    !resource ||
    !action ||
    typeof allowed !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid fields", body },
      { status: 400 },
    );
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (!ALLOWED_RESOURCES.includes(resource)) {
    return NextResponse.json({ error: "Invalid resource" }, { status: 400 });
  }

  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const profile = await getProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  /* ================= PERMISSION CHECK ================= */

  if (
    profile.role !== "super_admin" &&
    !(profile.role === "admin" && profile.company_id === company_id)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  /* ================= UPSERT ================= */

  const { error } = await supabase.from("permissions_matrix").upsert(
    {
      company_id,
      role,
      resource,
      action,
      allowed,
    },
    {
      onConflict: "company_id,role,resource,action",
    },
  );

  if (error) {
    return NextResponse.json(
      { error: "Failed to save permission", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
