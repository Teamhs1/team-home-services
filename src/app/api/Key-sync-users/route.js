export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  console.log("🟦 SYNC STARTED");

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log("🔑 Supabase client OK");

    // GET USERS FROM CLERK REST API
    const clerkRes = await fetch("https://api.clerk.dev/v1/users", {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    const raw = await clerkRes.json();
    if (!Array.isArray(raw)) throw new Error("Invalid Clerk API response");

    const rows = raw.map((u) => {
      const email =
        u.email_addresses?.find((e) => e.id === u.primary_email_address_id)
          ?.email_address ||
        u.email_addresses?.[0]?.email_address ||
        null;

      return {
        user_id: u.id, // 👈 MATCH PERFECTO CON TU TABLA
        email,
        full_name: `${u.first_name || ""} ${u.last_name || ""}`.trim(), // 👈 tu tabla usa full_name
        role: u.public_metadata?.role || "user",
      };
    });

    console.log("📦 Prepared rows:", rows.length);

    const { error } = await supabase
      .from("profiles")
      .upsert(rows, { onConflict: "user_id" }); // 👈 columna correcta

    if (error) {
      console.error("❌ SUPABASE UPSERT ERROR:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ total: rows.length });
  } catch (err) {
    console.error("🔥 SYNC FAILED:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
