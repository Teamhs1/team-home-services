import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =========================
   GET current settings
========================= */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("id, rentals_enabled")
      .single();

    if (error) {
      console.error("GET app_settings error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET app_settings crash:", err);
    return NextResponse.json(
      { error: "Failed to load app settings" },
      { status: 500 },
    );
  }
}

/* =========================
   UPDATE rentals flag
========================= */
export async function PATCH(req) {
  try {
    const { rentals_enabled } = await req.json();

    if (typeof rentals_enabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid rentals_enabled value" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("app_settings")
      .update({ rentals_enabled })
      // 👇 MUY IMPORTANTE: update SIEMPRE con WHERE
      .eq("id", "4428ceb5-af7d-40fc-9269-dea7861eb1d7");

    if (error) {
      console.error("PATCH app_settings error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH app_settings crash:", err);
    return NextResponse.json(
      { error: "Failed to update app settings" },
      { status: 500 },
    );
  }
}
