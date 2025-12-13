import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    // ✅ LEER SESIÓN DESDE EL REQUEST
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await req.json();

    const {
      title,
      service_type,
      assigned_to,
      assigned_client,
      scheduled_date,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("cleaning_jobs")
      .insert([
        {
          title,
          service_type: service_type || "standard",
          assigned_to: assigned_to || null,
          assigned_client: assigned_client || null,
          scheduled_date: scheduled_date || null,
          status: "pending",
          created_by: userId, // ✅ YA NO ES NULL
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Insert job error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ job: data });
  } catch (err) {
    console.error("💥 Error creating job:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
