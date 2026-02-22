// app/api/company/members/route.js
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1️⃣ Obtener perfil + company
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, company_id")
    .eq("clerk_id", userId)
    .single();

  if (profileError || !profile?.company_id) {
    return NextResponse.json([], { status: 200 });
  }

  // 🔒 Solo admin o client
  if (!["admin", "client"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2️⃣ Traer miembros de la company (🔥 ahora con avatar)
  const { data: members, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, email, avatar_url")
    .eq("company_id", profile.company_id)
    .order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(members || []);
}
