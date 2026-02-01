import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req) {
  try {
    /* =========================
       AUTH (CORRECTO)
    ========================= */
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* =========================
       SUPABASE (JWT + RLS)
    ========================= */
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${req.headers.get("authorization")}`,
          },
        },
      },
    );

    /* =========================
       FETCH JOBS + ADDRESS
    ========================= */
    const { data, error } = await supabase
      .from("cleaning_jobs")
      .select(
        `
        id,
        title,
        service_type,
        scheduled_date,
        status,
        unit_type,
        features,
        created_at,
        property:properties (
          id,
          address
        )
      `,
      )
      .eq("assigned_client", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Jobs fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    /* =========================
       NORMALIZE ADDRESS
    ========================= */
    const jobs = (data || []).map((job) => ({
      ...job,
      property_address: job.property?.address || "—",
    }));

    return NextResponse.json(jobs);
  } catch (err) {
    console.error("GET jobs exception:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
