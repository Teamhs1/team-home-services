// /api/test-pdf
import { PDFDocument } from "pdf-lib";

export async function GET() {
  const existingPdfBytes = await fetch("URL_DE_TU_PDF_EN_SUPABASE").then(
    (res) => res.arrayBuffer(),
  );

  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // 🔥 prueba simple
  firstPage.drawText("TEST ARNALDO", {
    x: 50,
    y: 700,
    size: 14,
  });

  const pdfBytes = await pdfDoc.save();

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
    },
  });
}
