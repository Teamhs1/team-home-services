import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* =====================
   GET OWNERS (YA LO TENÍAS)
===================== */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("clerk_id", userId)
    .single();

  let query = supabase.from("owners").select("*");

  if (profile.role !== "admin") {
    query = query.eq("company_id", profile.company_id);
  }

  const { data, error } = await query.order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ owners: data });
}

/* =====================
   CREATE OWNER (NUEVO)
===================== */
export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("clerk_id", userId)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { full_name, email } = body;

  if (!full_name) {
    return NextResponse.json(
      { error: "Full name is required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("owners")
    .insert({
      full_name,
      email: email || null,
      company_id: profile.company_id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ owner: data });
}
