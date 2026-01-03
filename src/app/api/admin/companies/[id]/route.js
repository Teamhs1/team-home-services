import "server-only";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";

/* =====================
   GET COMPANY (DETAIL)
===================== */
export async function GET(req, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Company ID required" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("companies")
    .select(
      `
      id,
      name,
      owner_name,
      owner_email,
      owner_phone,
      created_at
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

/* =====================
   UPDATE COMPANY
   + SYNC OWNER
===================== */
export async function PUT(req, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Company ID required" }, { status: 400 });
  }

  const body = await req.json();
  const { name, owner_name, owner_email, owner_phone } = body;

  /* =====================
     UPDATE COMPANY
  ===================== */
  const { data: company, error } = await supabaseServer
    .from("companies")
    .update({
      name,
      owner_name,
      owner_email,
      owner_phone,
    })
    .eq("id", id)
    .select(
      `
      id,
      name,
      owner_name,
      owner_email,
      owner_phone
    `
    )
    .single();

  if (error || !company) {
    return NextResponse.json(
      { error: error?.message || "Company not found" },
      { status: 500 }
    );
  }

  /* =====================
     SYNC OWNER TABLE
     (CONSISTENCY)
  ===================== */
  await supabaseServer.from("owners").upsert(
    {
      company_id: company.id,
      full_name: company.owner_name,
      email: company.owner_email,
      phone: company.owner_phone,
    },
    { onConflict: "company_id" }
  );

  return NextResponse.json(company);
}
