import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =========================
   Helper: Require super_admin
========================= */
async function requireSuperAdmin() {
  const { userId } = await auth();
  if (!userId) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("clerk_id", userId)
    .single();

  return profile?.role === "super_admin";
}

/* =========================
   GET current settings
========================= */
export async function GET() {
  try {
    const allowed = await requireSuperAdmin();
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("app_settings")
      .select("id, rentals_enabled")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
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
    const allowed = await requireSuperAdmin();
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
      .eq("id", "4428ceb5-af7d-40fc-9269-dea7861eb1d7");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update app settings" },
      { status: 500 },
    );
  }
}
