import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    console.log("🧩 SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "🔑 SERVICE ROLE present:",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabaseAdmin
      .from("cleaning_jobs")
      .select("*")
      .order("scheduled_date", { ascending: true });

    if (error) throw error;
    return Response.json(data, { status: 200 });
  } catch (err) {
    console.error("❌ Error in admin-fetch:", err.message);
    return Response.json(
      { error: err.message || "Unauthorized" },
      { status: 401 }
    );
  }
}
