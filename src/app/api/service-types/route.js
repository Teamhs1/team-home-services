import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );

    const { data, error } = await supabase
      .from("service_types")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("SERVICE TYPES ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
