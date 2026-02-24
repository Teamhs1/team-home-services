import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 🔎 Verificar role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (profileError || profile?.role !== "super_admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // 👑 Solo super_admin llega aquí
    const { data, error } = await supabaseAdmin
      .from("cleaning_jobs")
      .select("*")
      .order("scheduled_date", { ascending: true });

    if (error) throw error;

    return Response.json(data, { status: 200 });
  } catch (err) {
    console.error("❌ Error in admin-fetch:", err.message);
    return Response.json(
      { error: err.message || "Internal error" },
      { status: 500 },
    );
  }
}
