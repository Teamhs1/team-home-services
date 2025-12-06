import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // ============ KEYS ============
    const { data: keys, error: keysError } = await supabase
      .from("keys")
      .select("*");
    if (keysError) throw keysError;

    // ============ PROPERTIES ============
    const { data: props, error: propsError } = await supabase
      .from("properties")
      .select("*");
    if (propsError) throw propsError;

    // ============ RECENT KEYS ============
    const { data: recent } = await supabase
      .from("keys")
      .select("tag_code, type, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    // ============ WEEKLY ============
    const weeks = Array(4).fill(0);

    keys?.forEach((k) => {
      const week = Math.floor((new Date(k.created_at).getDate() - 1) / 7);
      if (week >= 0 && week < 4) weeks[week]++;
    });

    return Response.json({
      stats: {
        totalKeys: keys.length,
        available: keys.filter((k) => k.status === "available").length,
        missing: keys.filter((k) => k.status === "missing").length,
        checkedOut: keys.filter((k) => k.status === "checked_out").length,
        properties: props.length,
      },
      recentKeys: recent || [],
      weeklyData: [
        { week: "Week 1", value: weeks[0] },
        { week: "Week 2", value: weeks[1] },
        { week: "Week 3", value: weeks[2] },
        { week: "Week 4", value: weeks[3] },
      ],
    });
  } catch (err) {
    console.error("❌ DASHBOARD ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
