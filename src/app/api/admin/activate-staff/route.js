import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { staffClerkId, companyId } = await req.json();

    if (!staffClerkId || !companyId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 1️⃣ validar que quien llama es admin
    const { data: admin } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (admin?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2️⃣ activar staff
    const { error } = await supabase
      .from("profiles")
      .update({
        active_company_id: companyId,
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_id", staffClerkId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Activate staff error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
