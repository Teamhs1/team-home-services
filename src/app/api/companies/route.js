import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   GET · LIST COMPANIES
========================= */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("companies")
    .select(
      `
      id,
      name,
      email,
      phone,
      created_at,
      properties:properties(count),
      users:company_members(count)
    `
    )
    .order("name");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

/* =========================
   POST · CREATE COMPANY
========================= */
export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone } = body;

    if (!name) {
      return Response.json({ error: "Company name required" }, { status: 400 });
    }

    // 1️⃣ obtener profile del usuario creador
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (profileErr || !profile) {
      return Response.json(
        { error: "Creator profile not found" },
        { status: 400 }
      );
    }

    // 2️⃣ crear compañía
    const { data: company, error: companyErr } = await supabaseAdmin
      .from("companies")
      .insert({ name, email, phone })
      .select()
      .single();

    if (companyErr) {
      return Response.json({ error: companyErr.message }, { status: 500 });
    }

    // 3️⃣ asignar creador como admin (CLAVE)
    await supabaseAdmin.from("company_members").insert({
      company_id: company.id,
      profile_id: profile.id,
      role: "admin",
    });

    return Response.json(company);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
