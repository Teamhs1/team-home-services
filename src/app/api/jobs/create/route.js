import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req) {
  const { userId, getToken } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔑 JWT DE CLERK
  const token = await getToken({ template: "supabase" });

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

  const body = await req.json();
  const { title, service_type, assigned_to, assigned_client, scheduled_date } =
    body;

  if (!title || !scheduled_date) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("cleaning_jobs")
    .insert({
      title: title.trim(),
      service_type: service_type || "standard",
      assigned_to: assigned_to || null,
      assigned_client: assigned_client || null,
      scheduled_date,
      status: "pending",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ Insert job error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ job: data });
}
