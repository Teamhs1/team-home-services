import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const { application_id, template_id, draft, preview } = await req.json();

    console.log("🚀 SEND LEASE:", { application_id, template_id });

    if (!application_id) {
      return NextResponse.json(
        { error: "Missing application_id" },
        { status: 400 },
      );
    }

    // =================================================
    // 🔥 1. APPLICATION
    // =================================================
    const { data: app, error: appError } = await supabase
      .from("tenant_applications")
      .select("*")
      .eq("id", application_id)
      .maybeSingle();

    if (appError || !app) {
      console.error("❌ APP ERROR:", appError);
      throw new Error("Application not found");
    }

    // =================================================
    // 🔥 1.1 PROPERTY + COMPANY (SAFE 🔥)
    // =================================================
    let company = null;

    if (app.property_id) {
      const { data: property } = await supabase
        .from("properties")
        .select("*")
        .eq("id", app.property_id)
        .maybeSingle();

      if (property?.company_id) {
        const { data: comp } = await supabase
          .from("companies")
          .select("*")
          .eq("id", property.company_id)
          .maybeSingle();

        company = comp;
      }
    }

    // 🔥 fallback (NUNCA ROMPE)
    company = company || {
      name: "Team Home Services",
      address: "Moncton, NB",
      province: "NB",
      postal_code: "",
      phone: "",
      email: "info@teamhomeservices.ca",
    };

    // =================================================
    // 🔥 1.2 UNIT (IMPORTANTE)
    // =================================================
    let unit = null;
    let property = null;

    if (app.property_id) {
      const { data: prop } = await supabase
        .from("properties")
        .select("*")
        .eq("id", app.property_id)
        .maybeSingle();

      property = prop;
    }

    if (app.unit_id) {
      const { data: unitData } = await supabase
        .from("units")
        .select("*")
        .eq("id", app.unit_id)
        .maybeSingle();

      unit = unitData;
    }
    // =================================================
    // 🔥 2. LEASE
    // =================================================
    let { data: lease } = await supabase
      .from("leases")
      .select("*")
      .eq("application_id", application_id)
      .maybeSingle();

    if (!lease) {
      console.warn("⚠️ Lease not found → creating");

      const { data: newLease, error: createError } = await supabase
        .from("leases")
        .insert({
          application_id,
          rent_amount: null,
          status: "draft",
        })
        .select("*")
        .single();

      if (createError) throw createError;
      lease = newLease;
    }

    // =================================================
    // 🔥 2.1 SAVE DRAFT (CRÍTICO)
    // =================================================
    if (draft) {
      const { error: saveError } = await supabase
        .from("leases")
        .update({
          rent_amount: draft?.rent_amount ?? lease.rent_amount ?? null,
          start_date: draft?.start_date ?? lease.start_date ?? null,
          lease_type: draft?.lease_type ?? lease.lease_type ?? null,
          lease_duration: draft?.lease_duration ?? lease.lease_duration ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lease.id);

      if (saveError) {
        console.error("❌ SAVE DRAFT ERROR:", saveError);
      }
    }
    // =================================================
    // 🔥 3. TEMPLATE
    // =================================================
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("leases")
      .download("templates/lease-template-edit.pdf");

    if (downloadError || !fileData) {
      console.error("❌ DOWNLOAD ERROR:", downloadError);
      throw new Error("Failed to download template PDF");
    }

    const pdfBytes = await fileData.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // =================================================
    // 🔥 4. FILL FORM (DINÁMICO 🔥)
    // =================================================
    const form = pdfDoc.getForm();
    form.getFields().forEach((field) => {
      console.log("🧾 FIELD:", field.getName());
    });
    // 👑 LANDLORD (DINÁMICO)
    form.getTextField("ANameFirst")?.setText(company.name || "");
    form.getTextField("ANameLast")?.setText("");

    form.getTextField("AAddress")?.setText(company.address || "");
    form.getTextField("AProvince")?.setText(company.province || "");
    form.getTextField("APostalCode")?.setText(company.postal_code || "");

    form.getTextField("APhone")?.setText(company.phone || "");
    form.getTextField("AEmail")?.setText(company.email || "");
    form.getTextField("AFax")?.setText("");

    // ✅ checkbox landlord agent
    try {
      form.getCheckBox("AC")?.check();
    } catch {}

    const t1 = draft?.tenants?.[0];
    const t2 = draft?.tenants?.[1];
    const t3 = draft?.tenants?.[2];

    // TENANT 1
    form.getTextField("BNameFirst")?.setText(t1?.first_name || "");
    form.getTextField("BNameLast")?.setText(t1?.last_name || "");
    form.getTextField("BPhone")?.setText(t1?.phone || "");
    form.getTextField("BEmail")?.setText(t1?.email || "");

    // TENANT 2
    form.getTextField("BNameFirst2")?.setText(t2?.first_name || "");
    form.getTextField("BNameLast2")?.setText(t2?.last_name || "");
    form.getTextField("BPhone2")?.setText(t2?.phone || "");
    form.getTextField("BEmail2")?.setText(t2?.email || "");

    // TENANT 3
    form.getTextField("BNameFirst3")?.setText(t3?.first_name || "");
    form.getTextField("BNameLast3")?.setText(t3?.last_name || "");
    form.getTextField("BPhone3")?.setText(t3?.phone || "");
    form.getTextField("BEmail3")?.setText(t3?.email || "");

    // ✅ checkbox tenant emergency
    if (draft?.tenant_emergency_contact) {
      try {
        form.getCheckBox("BC")?.check();
      } catch {}
    }

    // =================================================
    // 🏠 SECTION 2 - PREMISES
    // =================================================

    form.getTextField("S2Address")?.setText(property?.address || "");

    form.getTextField("S2Apt")?.setText(unit?.unit || "");

    form.getTextField("S2Municipality")?.setText(property?.city || "Moncton");

    form.getTextField("S2PostalCode")?.setText(property?.postal_code || "");

    form.getTextField("S2ESpecify")?.setText(draft?.s2_smoke || "");
    form.getTextField("S2ESpecify2")?.setText(draft?.s2_pets || "");
    form.getTextField("S2ESpecify5")?.setText(draft?.s2_other || "");

    // =================================================
    // 🏡 TYPE OF PROPERTY (FIX REAL)
    // =================================================

    try {
      if (draft?.property_type === "house") {
        form.getCheckBox("S2")?.check();
      }
    } catch (e) {
      console.warn("Property checkbox not found");
    }

    // =================================================
    // 🛠 INSPECTION
    // =================================================

    form.getTextField("S2DDate")?.setText(new Date().toLocaleDateString());

    form.getTextField("S2DSpecify")?.setText("No repairs required");

    try {
      form.getCheckBox("S2D1")?.check(); // inspection done
    } catch {}

    // 🔥 start date base
    const startDate = draft?.start_date
      ? new Date(draft.start_date)
      : app.start_date
        ? new Date(app.start_date)
        : new Date();

    // =================================================
    // 📅 SECTION 3 - LENGTH OF TENANCY (DINÁMICO)
    // =================================================

    // 🔥 1. limpiar todos primero
    ["S3", "S3b", "S3c"].forEach((f) => {
      try {
        form.getCheckBox(f)?.uncheck();
      } catch {}
    });

    // 🔥 2. lógica basada en draft
    if (draft?.lease_type === "fixed") {
      // FIXED TERM
      try {
        form.getCheckBox("S3")?.check(); // tipo tenancy
        form.getCheckBox("S3c")?.check(); // fixed term
      } catch {}

      // 🔥 calcular fecha final (pro)
      if (draft?.lease_duration) {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + Number(draft.lease_duration));

        form.getTextField("S3Day2")?.setText(endDate.getDate().toString());
        form
          .getTextField("S3Month2")
          ?.setText((endDate.getMonth() + 1).toString());
        form.getTextField("S3Year2")?.setText(endDate.getFullYear().toString());
      }
    } else {
      // MONTH TO MONTH
      try {
        form.getCheckBox("S3")?.check();
        form.getCheckBox("S3b")?.check();
      } catch {}
    }

    // =================================================
    // 💰 SECTION 4 - RENT
    // =================================================

    // monto renta
    form
      .getTextField("S4Payable")
      ?.setText(
        draft?.rent_amount
          ? String(draft.rent_amount)
          : app?.rent_amount
            ? String(app.rent_amount)
            : "",
      );

    try {
      form.getCheckBox("S4ToLandlord")?.check();
    } catch {}

    // frecuencia → monthly default
    try {
      form.getCheckBox("S4Month")?.check();
    } catch {}

    // fecha primer pago
    form.getTextField("S4Day")?.setText("1");

    // ⚠️ ESTE CAMPO PUEDE NO EXISTIR COMO TEXTFIELD

    form.getTextField("S4Year")?.setText(new Date().getFullYear().toString());

    // día recurrente
    form.getTextField("S4Day3")?.setText("1");

    // aumento renta → no
    try {
      form.getCheckBox("S4b")?.check();
    } catch {}

    // ✅ FIX NOMBRE CORRECTO
    form.getTextField("S4ESpecify5")?.setText("");

    // =================================================
    // 🛠 SERVICES (SECTION 4C)
    // =================================================

    // ⚠️ SAFE MODE → evitar errores por nombres incorrectos
    try {
      form.getCheckBox("S4")?.check();
    } catch {}

    // ❌ eliminados campos que no existen en el PDF
    // =================================================
    // 💵 SECTION 5 - SECURITY DEPOSIT
    // =================================================

    if (app.deposit_amount) {
      try {
        form.getCheckBox("S5B")?.check();
      } catch {}

      form.getTextField("S5Amount")?.setText(String(app.deposit_amount));
    } else {
      try {
        form.getCheckBox("S5A")?.check();
      } catch {}
    }

    // =================================================
    // 📄 SECTION 6 - ASSIGNMENT
    // =================================================

    // default → no assignment
    try {
      form.getCheckBox("S6C")?.check();
    } catch {}

    // =================================================
    // ✍️ SECTION 7 - SIGNATURES
    // =================================================

    // landlord info (reutilizamos company)
    form.getTextField("6NameFirst")?.setText(company.name || "");
    form.getTextField("6NameLast")?.setText("");

    form.getTextField("6Address")?.setText(company.address || "");
    form.getTextField("6Province")?.setText(company.province || "");
    form.getTextField("6PostalCode")?.setText(company.postal_code || "");

    form.getTextField("6Phone")?.setText(company.phone || "");
    form.getTextField("6Email")?.setText(company.email || "");
    form.getTextField("6Fax")?.setText("");

    // emergency contacts (opcional)
    form.getTextField("6Name")?.setText("");
    form.getTextField("6Phone2")?.setText("");

    form.getTextField("6Name2")?.setText("");
    form.getTextField("6Phone23")?.setText("");

    // fechas firma
    const today = new Date();

    form.getTextField("S6Date")?.setText(today.toLocaleDateString());
    form.getTextField("S6Date2")?.setText(today.toLocaleDateString());
    form.getTextField("S6Date3")?.setText(today.toLocaleDateString());
    // 🔥 IMPORTANTE → ACTUALIZA LOS CAMPOS VISUALES
    form.updateFieldAppearances();

    // =================================================
    // 🔥 5. SAVE PDF
    // =================================================
    const finalPdf = await pdfDoc.save();

    const filePath = `generated/lease_${lease.id}_${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("leases")
      .upload(filePath, finalPdf, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("leases")
      .getPublicUrl(filePath);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // 🔥 SIEMPRE ACTUALIZA PDF EN DB
    await supabase
      .from("leases")
      .update({
        pdf_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lease.id);

    // 🔥 preview sigue funcionando
    if (preview) {
      return NextResponse.json({
        success: true,
        url: publicUrl,
      });
    }
    // =================================================
    // 🔥 6. UPDATE DB
    // =================================================
    await supabase
      .from("leases")
      .update({
        status: preview ? "draft" : "sent",
        template_id: template_id || null,
        pdf_url: publicUrl,
      })
      .eq("id", lease.id);

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (err) {
    console.error("❌ SEND LEASE ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
