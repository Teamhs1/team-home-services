import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    // 🔐 Auth Clerk
    const { userId, getToken } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔑 JWT para Supabase
    const token = await getToken({ template: "supabase" });
    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    // 🧠 Supabase con JWT
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // 🧹 Jobs del staff (assigned_to = clerk_id)
    const { data, error } = await supabase
      .from("cleaning_jobs")
      .select("*")
      .eq("assigned_to", userId)
      .order("scheduled_date", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
