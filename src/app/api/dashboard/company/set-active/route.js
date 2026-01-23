import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getProfileByClerkId } from "@/lib/permissions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfileByClerkId(userId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // 1️⃣ Si ya hay company activa → no hacer nada
  if (profile.active_company_id) {
    return NextResponse.json({ active_company_id: profile.active_company_id });
  }

  // 2️⃣ Inferir company desde properties existentes
  const { data: property } = await supabase
    .from("properties")
    .select("company_id")
    .limit(1)
    .eq("company_id", profile.company_id ?? null);

  if (!property || !property.company_id) {
    return NextResponse.json({ error: "No company found" }, { status: 400 });
  }

  // 3️⃣ Setear active_company_id
  await supabase
    .from("profiles")
    .update({ active_company_id: property.company_id })
    .eq("clerk_id", userId);

  return NextResponse.json({ active_company_id: property.company_id });
}
