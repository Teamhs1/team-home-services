// src/app/api/webhooks/clerk/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const payload = await req.json();
    const eventType = payload.type;
    const user = payload.data;

    if (eventType !== "user.created" && eventType !== "user.updated") {
      return NextResponse.json({ skipped: true });
    }

    const clerkId = user.id;
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const email = user.email_addresses?.[0]?.email_address || "";
    let role = user.public_metadata?.role;

    // 🧩 Rol por defecto
    if (!role || role === "null" || role === "") {
      console.log(`⚙️ Asignando rol 'client' por defecto a ${email}`);
      role = "client";

      try {
        await fetch(`https://api.clerk.com/v1/users/${clerkId}/metadata`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ public_metadata: { role } }),
        });
      } catch (clerkError) {
        console.warn(
          "⚠️ No se pudo actualizar rol en Clerk:",
          clerkError.message
        );
      }
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        clerk_id: clerkId,
        full_name: fullName,
        email,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_id" }
    );

    if (error) {
      console.error("❌ Error sincronizando en Supabase:", error);
      return NextResponse.json(
        { error: "Supabase sync failed" },
        { status: 500 }
      );
    }

    console.log(`✅ ${eventType}: ${email} (role: ${role})`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
