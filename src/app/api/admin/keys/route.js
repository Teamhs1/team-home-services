import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("keys")
      .select("*")
      .order("unit", { ascending: true });

    if (error) throw error;

    return Response.json({ keys: data });
  } catch (err) {
    console.error("❌ KEYS API ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
