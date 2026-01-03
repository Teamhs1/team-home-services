// /api/admin/clients/route.ts
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // validar admin
  const { data: admin } = await supabase
    .from("profiles")
    .select("role")
    .eq("clerk_id", userId)
    .single();

  if (admin?.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, clerk_id, full_name, email")
    .eq("role", "client");

  if (error) throw error;

  return Response.json(data);
}
