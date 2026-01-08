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

  // 🔹 Perfil real
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("clerk_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  // 🔹 Query base (SIN FILTROS)
  let query = supabase
    .from("expenses")
    .select(
      `
      id,
      description,
      amount,
      tax,
      final_cost,
      expense_date,
      invoice_url,
      property_id,
      contractor_id,
      contractor_name,
      created_at,
      unit:units (
        id,
        unit
      )
    `
    )
    .order("created_at", { ascending: false });

  /* =========================
     ROLE LOGIC
  ========================== */

  // 🧑‍💼 ADMIN → ve todo (ya listo)
  if (profile.role === "admin") {
    const { data } = await query;
    return NextResponse.json(data ?? []);
  }

  // 👷 STAFF → verificar permiso y VER TODO
  if (profile.role === "staff") {
    const { data: permission } = await supabase
      .from("staff_permissions")
      .select("can_view")
      .eq("staff_profile_id", profile.id)
      .eq("resource", "expenses")
      .single();

    if (!permission?.can_view) {
      return NextResponse.json([]);
    }

    const { data } = await query;
    return NextResponse.json(data ?? []);
  }

  // 🧑 CLIENT → solo sus properties
  if (profile.role === "client") {
    const { data: clientProperties } = await supabase
      .from("properties")
      .select("id")
      .eq("client_id", profile.id);

    const propertyIds = clientProperties?.map((p) => p.id) ?? [];

    if (propertyIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data } = await query.in("property_id", propertyIds);
    return NextResponse.json(data ?? []);
  }

  return NextResponse.json([]);
}
