import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 🔑 service role (sin RLS)
);

/* ======================================================
   CONSTANTS (WHITELISTS)
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
];

const ALLOWED_ACTIONS = ["view", "create", "edit", "delete"];

// 🔁 Aliases frontend → backend
const RESOURCE_ALIASES = {
  permission: "permissions",
  perms: "permissions",
  company: "companies",
  user: "users",
  property: "properties",
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

/* ======================================================
   GET · READ PERMISSIONS MATRIX
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

  if (profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const role = normalize(searchParams.get("role") || "staff");

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "Invalid role", role, allowed: ALLOWED_ROLES },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("permissions_matrix")
    .select("resource, action, allowed")
    .eq("company_id", profile.company_id)
    .eq("role", role);

  if (error) {
    console.error("LOAD PERMISSIONS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load permissions" },
      { status: 500 }
    );
  }

  // 🔁 Normalizar matriz completa
  const matrix = {};

  for (const row of data) {
    const resource = normalize(row.resource);
    const action = normalize(row.action);

    if (!matrix[resource]) matrix[resource] = {};
    matrix[resource][action] = Boolean(row.allowed);
  }

  return NextResponse.json({
    company_id: profile.company_id,
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

  /* ================= VALIDATION ================= */
  if (
    !company_id ||
    !role ||
    !resource ||
    !action ||
    typeof allowed !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid fields", body },
      { status: 400 }
    );
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "Invalid role", role, allowed: ALLOWED_ROLES },
      { status: 400 }
    );
  }

  if (!ALLOWED_RESOURCES.includes(resource)) {
    return NextResponse.json(
      {
        error: "Invalid resource",
        received: resource,
        allowed: ALLOWED_RESOURCES,
      },
      { status: 400 }
    );
  }

  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: "Invalid action", action, allowed: ALLOWED_ACTIONS },
      { status: 400 }
    );
  }

  const profile = await getProfile(userId);
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (profile.company_id !== company_id) {
    return NextResponse.json(
      { error: "Cross-company update forbidden" },
      { status: 403 }
    );
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
    }
  );

  if (error) {
    console.error("PERMISSION SAVE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to save permission", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
