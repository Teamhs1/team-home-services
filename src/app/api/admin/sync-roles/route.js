import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST() {
  console.log("🚀 /api/admin/sync-roles called (create missing users)");

  try {
    // 🔹 Llama directamente al API de Clerk
    const res = await fetch("https://api.clerk.dev/v1/users", {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ Clerk API error:", errText);
      return NextResponse.json(
        { message: "Failed to fetch users from Clerk", details: errText },
        { status: 500 }
      );
    }

    const users = await res.json();
    console.log("🧠 Clerk returned", users.length, "users");

    if (users.length === 0) {
      return NextResponse.json({ message: "No users found" }, { status: 404 });
    }

    for (const u of users) {
      const email = u.email_addresses?.[0]?.email_address || null;
      const full_name =
        `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—";
      const avatar_url = u.image_url || null;
      const role = u.public_metadata?.role || "client";
      const clerk_id = u.id;

      if (!clerk_id) continue;

      // 🔹 Verifica si ya existe en Supabase
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", clerk_id)
        .single();

      if (existing) {
        // 🔸 Actualiza
        const { error } = await supabase
          .from("profiles")
          .update({ role, email, full_name, avatar_url })
          .eq("clerk_id", clerk_id);

        if (error) console.error(`❌ Error updating ${email}:`, error.message);
        else console.log(`✅ Updated ${email} → ${role}`);
      } else {
        // 🔸 Crea nuevo
        const { error } = await supabase.from("profiles").insert([
          {
            clerk_id,
            email,
            full_name,
            avatar_url,
            role,
            status: "active",
          },
        ]);

        if (error) console.error(`❌ Error inserting ${email}:`, error.message);
        else console.log(`🆕 Created new profile for ${email} → ${role}`);
      }
    }

    return NextResponse.json(
      { message: "Roles synced successfully!" },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error in sync-roles:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
