import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const { application_id } = await req.json();

    // 1. Obtener application
    const { data: app, error: appError } = await supabase
      .from("tenant_applications")
      .select("*")
      .eq("id", application_id)
      .single();

    if (appError) throw appError;

    if (!app) {
      throw new Error("Application not found");
    }

    // 🔒 Evitar duplicados
    if (app.status === "approved") {
      return NextResponse.json({
        message: "Application already approved",
      });
    }

    // 2. Crear tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        company_id: app.company_id,
        unit_id: app.unit_id,
        first_name: app.first_name,
        last_name: app.last_name,
        email: app.email,
        phone: app.phone,
      })
      .select()
      .single();

    if (tenantError) throw tenantError;

    // 🔥 3. Crear lease automático (SIN ROMPER SI FALLA)
    let lease = null;

    try {
      const { data: newLease, error: leaseError } = await supabase
        .from("leases")
        .insert({
          company_id: app.company_id,
          tenant_id: tenant.id,
          unit_id: app.unit_id,
          rent_amount: 1200, // luego lo haces dinámico
          start_date: new Date().toISOString(),
          status: "active",
        })
        .select()
        .single();

      if (!leaseError) {
        lease = newLease;
      } else {
        console.warn("Lease creation failed:", leaseError.message);
      }
    } catch (err) {
      console.warn("Lease error:", err.message);
    }

    // 4. Actualizar application
    await supabase
      .from("tenant_applications")
      .update({ status: "approved" })
      .eq("id", application_id);

    return NextResponse.json({
      tenant,
      lease, // 👈 opcional (puede ser null)
    });
  } catch (err) {
    console.error("APPROVE ERROR:", err.message);

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
