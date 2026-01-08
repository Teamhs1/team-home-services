import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 🔹 obtener profile REAL
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("clerk_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // 🧑‍💼 ADMIN → todo
  if (profile.role === "admin") {
    return NextResponse.json({
      isAdmin: true,
      permissions: [],
    });
  }

  // 👷 STAFF → USAR UUID DEL PROFILE
  const { data: permissions } = await supabase
    .from("staff_permissions")
    .select("resource, can_view, can_create, can_edit, can_delete")
    .eq("staff_profile_id", profile.id); // 🔥 CLAVE

  return NextResponse.json({
    isAdmin: false,
    permissions: permissions ?? [],
  });
}
