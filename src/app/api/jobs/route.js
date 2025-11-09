import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ GET /api/jobs
export async function GET() {
  try {
    console.log("🟢 Incoming /api/jobs request...");

    // ✅ Clerk valida la sesión automáticamente
    const { userId, sessionClaims } = auth();

    if (!userId) {
      console.warn("🚫 No user session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = sessionClaims?.publicMetadata?.role || "client";
    console.log(`🧠 Fetching jobs for user: ${userId} (role: ${role})`);

    // 🔹 Query según el rol
    let query = supabase.from("cleaning_jobs").select("*");

    if (role === "admin") {
      query = query.order("scheduled_date", { ascending: true });
    } else if (role === "staff") {
      query = query.eq("assigned_to", userId);
    } else if (role === "client") {
      query = query.eq("created_by", userId);
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    const { data, error } = await query;
    if (error) throw error;

    console.log(`✅ ${data?.length || 0} jobs fetched for ${role}`);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("💥 Error in /api/jobs:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
