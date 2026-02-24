// /api/admin/clients/route.ts
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  /* =========================
     GET CURRENT USER
  ========================= */
  const { data: currentUser, error: userError } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("clerk_id", userId)
    .single();

  if (userError || !currentUser) {
    return new Response("Forbidden", { status: 403 });
  }

  /* =========================
     PERMISSION CHECK
  ========================= */
  if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  /* =========================
     BASE QUERY
  ========================= */
  let query = supabase
    .from("profiles")
    .select("id, clerk_id, full_name, email, company_id")
    .eq("role", "client");

  // 🏢 Admin → solo su company
  if (currentUser.role === "admin") {
    query = query.eq("company_id", currentUser.company_id);
  }

  const { data, error } = await query.order("full_name");

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json(data || []);
}
