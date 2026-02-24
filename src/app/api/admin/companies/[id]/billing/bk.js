import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";

export async function PATCH(req, { params }) {
  const { userId } = await auth(); // 🔥 AQUI EL FIX

  console.log("🔎 Clerk userId:", userId);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseServer
    .from("profiles")
    .select("role")
    .eq("clerk_id", userId)
    .single();

  if (profileError || !profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const { billing_enabled } = await req.json();

  if (typeof billing_enabled !== "boolean") {
    return NextResponse.json(
      { error: "Invalid billing value" },
      { status: 400 },
    );
  }

  const { error } = await supabaseServer
    .from("companies")
    .update({ billing_enabled })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
