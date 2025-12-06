export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. FETCH USERS FROM CLERK
    const clerkRes = await fetch("https://api.clerk.dev/v1/users", {
      headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
    });

    if (!clerkRes.ok) {
      const err = await clerkRes.text();
      return NextResponse.json(
        { error: "Clerk API failed", details: err },
        { status: 500 }
      );
    }

    const clerkUsers = await clerkRes.json();

    // 2. MAP TO NEW PROFILES STRUCTURE
    const rows = clerkUsers.map((u) => ({
      user_id: u.id,
      email:
        u.email_addresses?.find((e) => e.id === u.primary_email_address_id)
          ?.email_address ||
        u.email_addresses?.[0]?.email_address ||
        null,
      full_name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
      role: u.public_metadata?.role || "user",
      avatar_url:
        u.image_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          u.first_name + " " + u.last_name
        )}`,
    }));

    // 3. UPSERT
    const { error } = await supabase
      .from("profiles")
      .upsert(rows, { onConflict: "user_id" });

    if (error) {
      console.error("❌ SUPABASE ERROR:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({
      message: "✅ Backfill completed successfully",
      total: rows.length,
    });
  } catch (err) {
    console.error("❌ BACKFILL ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
