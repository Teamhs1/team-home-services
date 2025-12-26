// lib/permissions.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
