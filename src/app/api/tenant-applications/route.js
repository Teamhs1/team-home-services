import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// 🔹 GET
export async function GET() {
  try {
    let { data, error } = await supabase
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
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("⚠️ JOIN failed, fallback:", error.message);

      const fallback = await supabase
        .from("tenant_applications")
        .select("*")
        .order("created_at", { ascending: false });

      return NextResponse.json(fallback.data || []);
    }

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("GET ERROR:", err.message);
    return NextResponse.json([]);
  }
}

// 🔹 POST
export async function POST(req) {
  try {
    let body;

    const contentType = req.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    }

    console.log("📦 Incoming application:", body);

    // 🔥 VALIDACIONES
    if (!body.first_name || !body.email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 🔥 NORMALIZAR NUMÉRICO
    const income = body.income ? Number(body.income) : null;

    if (body.income && isNaN(income)) {
      return NextResponse.json(
        { error: "Income must be a number" },
        { status: 400 },
      );
    }

    // 🔥 AUTO-RESOLVER PROPERTY + COMPANY
    let property_id = body.property_id || null;
    let company_id = body.company_id || null;

    if ((!property_id || !company_id) && body.unit_id) {
      const { data: unitData } = await supabase
        .from("units")
        .select(
          `
          id,
          property:properties (
            id,
            company_id
          )
        `,
        )
        .eq("id", body.unit_id)
        .single();

      if (unitData?.property) {
        property_id = unitData.property.id;
        company_id = unitData.property.company_id;
      }
    }

    const payload = {
      ...body,
      income,
      property_id,
      company_id,
      paystubs:
        Array.isArray(body.paystubs) && body.paystubs.length > 0
          ? body.paystubs
          : null,
    };

    // 🔥 INSERT + JOIN
    let { data, error } = await supabase
      .from("tenant_applications")
      .insert(payload)
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
      .single();

    if (error) {
      console.warn("⚠️ INSERT JOIN failed, fallback:", error.message);

      const fallback = await supabase
        .from("tenant_applications")
        .insert(payload)
        .select("*")
        .single();

      if (fallback.error) throw fallback.error;

      return NextResponse.json(fallback.data);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("🔥 POST ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
