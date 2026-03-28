import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const { lease_id } = await req.json();

    // 🔹 1. Obtener lease + tenant + joins
    const { data: lease, error } = await supabase
      .from("leases")
      .select(
        `
        *,
        tenants (
          first_name,
          last_name,
          email
        ),
        units (
          unit,
          rent_price
        ),
        properties (
          address
        ),
        companies (
          name
        )
      `,
      )
      .eq("id", lease_id)
      .single();

    if (error) throw error;

    const tenantName = `${lease.tenants?.first_name || ""} ${lease.tenants?.last_name || ""}`;

    // 🔥 2. Cargar PDF base (TU ARCHIVO)
    const pdfBytes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/pdfs/leases/snb-standard-lease.pdf`,
    ).then((res) => res.arrayBuffer());

    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();

    // =========================
    // ✍️ MAPEO REAL DEL SNB
    // =========================

    // 📄 PAGE 1 – PARTIES
    const page1 = pages[0];

    page1.drawText(lease.companies?.name || "N/A", {
      x: 100,
      y: 520,
      size: 10,
    });

    page1.drawText(tenantName || "N/A", {
      x: 100,
      y: 420,
      size: 10,
    });

    page1.drawText(lease.tenants?.email || "", {
      x: 100,
      y: 400,
      size: 10,
    });

    // 📄 PAGE 2 – ADDRESS
    const page2 = pages[1];

    page2.drawText(lease.properties?.address || "N/A", {
      x: 100,
      y: 650,
      size: 10,
    });

    page2.drawText(lease.units?.unit || "", {
      x: 400,
      y: 650,
      size: 10,
    });

    // 📄 PAGE 3 – RENT
    const page3 = pages[2];

    page3.drawText(`${lease.rent_amount || lease.units?.rent_price || 0}`, {
      x: 200,
      y: 620,
      size: 12,
    });

    // =========================
    // 💾 3. GENERAR PDF FINAL
    // =========================

    const finalPdf = await pdfDoc.save();

    const filePath = `lease_${lease.id}.pdf`;

    // 🔹 4. Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("leases")
      .upload(filePath, finalPdf, {
        contentType: "application/pdf",
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
