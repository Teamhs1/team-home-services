import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

/* =========================
   SUPABASE (SERVICE ROLE)
========================= */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =========================
   GET JOB DETAIL
========================= */
export async function GET(req, { params }) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params; // ✅ AQUÍ

    const { data: job, error: jobError } = await supabase
      .from("cleaning_jobs")
      .select(
        `
        id,
        title,
        scheduled_date,
        service_type,
        status,
        duration_minutes,
        completed_at,
        created_at,
        started_at,
        unit_type,
        features,
        property_address,
        assigned_to,
        assigned_client_clerk_id
      `,
      )
      .eq("id", id)
      .single();

    if (jobError || !job) {
      console.error("GET job error:", jobError);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    /* 2️⃣ CLIENT (by clerk_id) */
    let client = null;
    if (job.assigned_client_clerk_id) {
      const { data } = await supabase
        .from("profiles")
        .select("clerk_id, full_name, email")
        .eq("clerk_id", job.assigned_client_clerk_id)
        .maybeSingle();

      client = data || null;
    }

    /* 3️⃣ STAFF (by clerk_id) */
    let staff = null;
    if (job.assigned_to) {
      const { data } = await supabase
        .from("profiles")
        .select("clerk_id, full_name, email")
        .eq("clerk_id", job.assigned_to)
        .maybeSingle();

      staff = data || null;
    }

    /* 4️⃣ RESPONSE */
    return NextResponse.json({
      ...job,
      client,
      staff,
    });
  } catch (err) {
    console.error("GET job exception:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* =========================
   PATCH JOB
   (inline edits: title)
========================= */
export async function PATCH(req, context) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { title } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }

    const { error } = await supabase
      .from("cleaning_jobs")
      .update({ title })
      .eq("id", id);

    if (error) {
      console.error("PATCH job error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH job exception:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
