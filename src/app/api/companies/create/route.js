import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, phone, notes } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // 1️⃣ Obtener profile PRIMERO
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (profileErr || !profile) {
      console.error("PROFILE ERROR:", profileErr);
      return NextResponse.json({ error: "Profile not found" }, { status: 500 });
    }

    // 2️⃣ Crear company con UUID correcto
    const { data: company, error: companyErr } = await supabaseAdmin
      .from("companies")
      .insert({
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        notes: notes || null,
        created_by: profile.id, // ✅ UUID válido
      })
      .select()
      .single();

    if (companyErr) {
      console.error("COMPANY INSERT ERROR:", companyErr);
      return NextResponse.json(
        { error: "Failed to create company" },
        { status: 500 }
      );
    }

    // 3️⃣ Asignar creador como admin
    const { error: memberErr } = await supabaseAdmin
      .from("company_members")
      .insert({
        company_id: company.id,
        profile_id: profile.id,
        role: "admin",
      });

    if (memberErr) {
      console.error("MEMBER INSERT ERROR:", memberErr);
      return NextResponse.json(
        { error: "Company created but failed to assign admin" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, company });
  } catch (err) {
    console.error("CREATE COMPANY API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
