import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing application id" },
        { status: 400 },
      );
    }

    // 🔥 QUERY SIMPLE (SIN FK NAMES)
    const { data, error } = await supabase
      .from("tenant_applications")
      .select(
        `
        *,
        unit:units (
          id,
          unit,
          rent_price
        ),
        property:properties (
          id,
          address,
          postal_code
        ),
        company:companies (
          id,
          name
        )
      `,
      )
      .eq("id", id)
      .maybeSingle(); // 🔥 más seguro que single()

    if (error) {
      console.error("❌ GET ERROR:", error);

      // 🔥 fallback para no romper
      const fallback = await supabase
        .from("tenant_applications")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      return NextResponse.json(fallback.data || {});
    }

    return NextResponse.json(data || {});
  } catch (err) {
    console.error("🔥 ROUTE ERROR:", err.message);
    return NextResponse.json({}, { status: 200 });
  }
}
