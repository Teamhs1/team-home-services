import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(req, { params }) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  // 🔹 Obtener perfil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("clerk_id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // 🔐 Endpoint EXCLUSIVO admin
  if (profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 🔹 Admin puede ver incluso invoices eliminadas
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      `
      id,
      type,
      amount_cents,
      status,
      notes,
      deleted_at,
      created_at,
      properties ( address ),
      units ( unit )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json({ invoice });
}
