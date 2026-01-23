import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function PATCH(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { member_profile_id, role } = await req.json();

    if (!member_profile_id || !role) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (!["client", "staff"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // 🔐 verificar que quien hace la acción es client
    const { data: me } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (!me || me.role !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🚫 no permitir cambiarte a ti mismo
    if (me.id === member_profile_id) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 },
      );
    }

    // 🔄 update
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", member_profile_id)
      .eq("company_id", me.company_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
