import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req, { params }) {
  try {
    const { userId } = await auth();
    const { id: propertyId } = params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔐 Perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { owner_id } = await req.json();

    if (!owner_id) {
      return NextResponse.json(
        { error: "owner_id is required" },
        { status: 400 },
      );
    }

    // ✅ Asignar owner
    const { error } = await supabase
      .from("properties")
      .update({ owner_id })
      .eq("id", propertyId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ ASSIGN OWNER ERROR:", err);
    return NextResponse.json(
      { error: "Failed to assign owner" },
      { status: 500 },
    );
  }
}
