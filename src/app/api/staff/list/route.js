import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 🔎 perfil del admin
    const { data: admin } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    // 👥 staff de la misma compañía
    const { data: staff } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "staff")
      .eq("company_id", admin.company_id)
      .order("full_name");

    return NextResponse.json(staff || []);
  } catch (err) {
    console.error("STAFF LIST ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
