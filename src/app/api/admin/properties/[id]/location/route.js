import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PATCH(req, { params }) {
  try {
    const { userId } = auth(); // ✅ App Router
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { latitude, longitude, postal_code } = await req.json();

    // ✅ validación correcta
    if (latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "Missing coordinates" },
        { status: 400 }
      );
    }

    // 🔐 validar admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("properties")
      .update({
        latitude,
        longitude,
        postal_code: postal_code ?? null, // ✅ clave
      })
      .eq("id", propertyId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ PATCH LOCATION ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}
