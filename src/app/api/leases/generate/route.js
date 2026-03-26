import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const { lease_id } = await req.json();

    // 🔹 1. Obtener lease + tenant
    const { data: lease, error } = await supabase
      .from("leases")
      .select(
        `
        *,
        tenants (
          first_name,
          last_name,
          email
        )
      `,
      )
      .eq("id", lease_id)
      .single();

    if (error) throw error;

    const tenantName = `${lease.tenants.first_name} ${lease.tenants.last_name}`;

    // 🔹 2. HTML template simple (MVP)
    const html = `
      <h1>Residential Lease Agreement</h1>
      <p><strong>Tenant:</strong> ${tenantName}</p>
      <p><strong>Email:</strong> ${lease.tenants.email}</p>
      <p><strong>Rent:</strong> $${lease.rent_amount}/month</p>
      <p><strong>Start Date:</strong> ${new Date(lease.start_date).toLocaleDateString()}</p>
      <p><strong>Status:</strong> ${lease.status}</p>
    `;

    // 🔥 3. Convertir a "pseudo PDF" (MVP rápido)
    const buffer = Buffer.from(html, "utf-8");

    const filePath = `lease_${lease.id}.html`;

    // 🔹 4. Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("leases")
      .upload(filePath, buffer, {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 🔹 5. Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from("leases")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // 🔹 6. Guardar en DB
    await supabase
      .from("leases")
      .update({ pdf_url: publicUrl })
      .eq("id", lease.id);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("GENERATE LEASE ERROR:", err.message);

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
