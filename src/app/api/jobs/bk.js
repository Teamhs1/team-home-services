import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function GET(req) {
  const { userId, getToken } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    },
  );

  const { data, error } = await supabase
    .from("cleaning_jobs") // ✅ TABLA CORRECTA
    .select(
      `
      id,
      title,
      service_type,
      scheduled_date,
      status,
      unit_type,       -- 👈 CLAVE
      features,
      created_at
    `,
    )
    .eq("assigned_client", userId) // ⚠️ solo si aquí guardas clerk_id
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
