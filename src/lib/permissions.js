// lib/permissions.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   PROFILE
========================= */
export async function getProfileByClerkId(clerkId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, clerk_id, role, active_company_id")
    .eq("clerk_id", clerkId)
    .single();

  if (error) {
    console.error("getProfileByClerkId ERROR:", error);
    return null;
  }

  return data;
}

/* =========================
   PERMISSION CHECK
========================= */
export async function hasPermission({
  staff_profile_id,
  resource,
  action = "view",
}) {
  if (!staff_profile_id || !resource) return false;

  // Por ahora solo view
  if (action !== "view") return false;

  const { data, error } = await supabase
    .from("staff_permissions")
    .select("id")
    .eq("staff_profile_id", staff_profile_id)
    .eq("resource", resource)
    .maybeSingle();

  if (error) {
    console.error("hasPermission ERROR:", error);
    return false;
  }

  // ✅ si existe la fila → permitido
  return !!data;
}

/* =========================
   LOAD STAFF PERMISSIONS (UI)
========================= */
export async function getStaffPermissions(staff_profile_id) {
  const { data, error } = await supabase
    .from("staff_permissions")
    .select("resource")
    .eq("staff_profile_id", staff_profile_id);

  if (error) {
    console.error("getStaffPermissions ERROR:", error);
    return [];
  }

  return data.map((p) => p.resource);
}
