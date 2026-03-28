import { PDFDocument } from "pdf-lib";

export async function generateLeasePdf({
  templateBytes,
  app,
  lease,
  draft,
  property,
  unit,
  company,
}) {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  // ✅ HELPERS PRO
  const safeText = (name, value) => {
    try {
      form.getTextField(name)?.setText(value || "");
    } catch {}
  };

  const safeCheck = (name) => {
    try {
      form.getCheckBox(name)?.check();
    } catch {}
  };

  // =================================================
  // 👑 LANDLORD
  // =================================================
  safeText("ANameFirst", company?.name);
  safeText("AAddress", company?.address);
  safeText("AProvince", company?.province);
  safeText("APostalCode", company?.postal_code);
  safeText("APhone", company?.phone);
  safeText("AEmail", company?.email);
  safeCheck("AC");

  // =================================================
  // 👤 TENANTS
  // =================================================
  draft?.tenants?.forEach((t, i) => {
    const index = i === 0 ? "" : i + 1;

    safeText(`BNameFirst${index}`, t.first_name);
    safeText(`BNameLast${index}`, t.last_name);
    safeText(`BPhone${index}`, t.phone);
    safeText(`BEmail${index}`, t.email);
  });

  // =================================================
  // 🏠 PREMISES
  // =================================================
  safeText("S2Address", property?.address);
  safeText("S2Apt", unit?.unit);
  safeText("S2Municipality", property?.city || "Moncton");
  safeText("S2PostalCode", property?.postal_code);

  // =================================================
  // 💰 RENT (FIX PRO 🔥)
  // =================================================
  const rent =
    draft?.rent_amount ??
    lease?.rent_amount ??
    app?.rent_amount ??
    unit?.rent_price ??
    "";

  safeText("S4Payable", String(rent));
  safeCheck("S4Month");

  // =================================================
  // 📅 DATES
  // =================================================
  const today = new Date();
  safeText("S6Date", today.toLocaleDateString());

  // =================================================
  form.updateFieldAppearances();

  const finalPdf = await pdfDoc.save();

  return finalPdf;
}
