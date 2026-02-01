import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePDF from "@/lib/pdf/InvoicePDF";

// ⚠️ aquí puedes usar Resend, Sendgrid, Nodemailer
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // 1️⃣ Load invoice
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(
        `
        *,
        properties(address),
        units(unit)
        `,
      )
      .eq("id", id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 2️⃣ Generate PDF buffer
    const pdfBuffer = await renderToBuffer(<InvoicePDF invoice={invoice} />);

    // 3️⃣ Send email (example with Gmail SMTP)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: "Team Home Services <no-reply@teamhomeservices.ca>",
      to: "client@email.com", // 🔜 luego dinámico
      subject: "Invoice from Team Home Services",
      text: "Please find your invoice attached.",
      attachments: [
        {
          filename: `invoice-${invoice.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    // 4️⃣ Update status
    const { data: updated } = await supabase
      .from("invoices")
      .update({ status: "sent" })
      .eq("id", id)
      .select()
      .single();

    return NextResponse.json({ invoice: updated });
  } catch (err) {
    console.error("Email invoice error:", err);
    return NextResponse.json(
      { error: "Failed to send invoice" },
      { status: 500 },
    );
  }
}
