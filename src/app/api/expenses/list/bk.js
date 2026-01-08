import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req) {
  const { userId } = getAuth(req); // ✅ FIX

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("clerk_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  let query = supabase
    .from("expenses")
    .select(
      `
    id,
    description,
    amount,
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

  // 🧭 ROLE-BASED VISIBILITY

  // STAFF → solo sus expenses
  if (profile.role === "staff") {
    query = query.eq("contractor_id", profile.id);
  }

  // CLIENT → expenses de sus properties
  if (profile.role === "client") {
    // 1️⃣ obtener properties del client
    const { data: clientProperties, error: propError } = await supabase
      .from("properties")
      .select("id")
      .eq("client_id", profile.id);

    if (propError) {
      console.error("CLIENT PROPERTIES ERROR:", propError);
      return NextResponse.json(
        { error: "Failed to load client properties" },
        { status: 500 }
      );
    }

    const propertyIds = clientProperties.map((p) => p.id);

    // si no tiene properties, no hay expenses
    if (propertyIds.length === 0) {
      return NextResponse.json([]);
    }

    // 2️⃣ filtrar expenses por esas properties
    query = query.in("property_id", propertyIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error("EXPENSE LIST ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load expenses" },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}
