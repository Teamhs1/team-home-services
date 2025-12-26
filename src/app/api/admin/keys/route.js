import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   GET → List keys
========================= */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("keys")
      .select("*")
      .order("unit", { ascending: true });

    if (error) throw error;

    return Response.json({ keys: data });
  } catch (err) {
    console.error("❌ KEYS API GET ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

/* =========================
   POST → Create key
========================= */
export async function POST(req) {
  try {
    const body = await req.json();

    const { property_id, unit, type, tag_code, status } = body;

    if (!property_id || !type || !tag_code) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("keys")
      .insert([
        {
          property_id,
          unit,
          type,
          tag_code,
          status: status || "available",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return Response.json({ key: data }, { status: 201 });
  } catch (err) {
    console.error("❌ KEYS API POST ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
