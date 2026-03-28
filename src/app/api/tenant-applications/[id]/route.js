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

    // 🔥 QUERY CORREGIDA (USANDO FK EXPLÍCITO)
    const { data, error } = await supabase
      .from("tenant_applications")
      .select(
        `
        *,
        unit:units!tenant_applications_unit_id_fkey (
          id,
          unit,
          rent_price
        ),
        property:properties!tenant_applications_property_id_fkey (
          id,
          address,
          postal_code
        ),
        company:companies!tenant_applications_company_id_fkey (
          id,
          name
        )
      `,
      )
      .eq("id", id)
      .maybeSingle(); // 🔥 seguro

    if (error) {
      console.error("❌ GET ERROR:", error);

      // 🔥 fallback seguro
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
