import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 🔥 FULL ACCESS SIN POLÍTICAS
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("sync_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    return NextResponse.json({ logs: data });
  } catch (e) {
    console.log("❌ Error fetching logs:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
