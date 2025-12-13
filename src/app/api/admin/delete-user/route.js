import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { clerkId, profileId } = await req.json();

    if (!clerkId || !profileId) {
      return NextResponse.json(
        { error: "Missing user identifiers" },
        { status: 400 }
      );
    }

    // 1️⃣ Eliminar perfil en Supabase
    const { error: supaError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", profileId);

    if (supaError) {
      console.error("SUPABASE DELETE ERROR:", supaError);
      return NextResponse.json({ error: supaError.message }, { status: 500 });
    }

    // 2️⃣ Eliminar usuario en Clerk
    await clerkClient.users.deleteUser(clerkId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    return NextResponse.json(
      { error: "Server error deleting user" },
      { status: 500 }
    );
  }
}
