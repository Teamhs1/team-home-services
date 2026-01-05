import { createClient } from "@supabase/supabase-js";

export async function getProfileIdFromClerk(clerkId, token) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .single();

  if (error || !data) {
    throw new Error("Profile not found for clerk_id");
  }

  return data.id; // ✅ UUID
}
