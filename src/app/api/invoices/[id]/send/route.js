// src/app/api/invoices/[id]/send/route.js
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req, { params }) {
  try {
    // 🔐 Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔍 validar perfil / rol
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🔑 Init Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 },
      );
    }

    const resend = new Resend(apiKey);
    const { id } = params;

    // 1️⃣ Obtener invoice válida
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(
        `
        id,
        amount_cents,
        status,
        deleted_at,
        properties ( address )
        `,
      )
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status !== "draft") {
      return NextResponse.json(
        { error: "Invoice cannot be sent in its current status" },
        { status: 400 },
      );
    }

    // 2️⃣ Enviar email
    await resend.emails.send({
      from: "Team Home Services <invoices@teamhomeservices.ca>",
      to: ["tuemail@gmail.com"], // luego dinámico
      subject: "Your invoice from Team Home Services",
      html: `
        <h2>Invoice</h2>
        <p><strong>Property:</strong> ${invoice.properties?.address ?? "—"}</p>
        <p><strong>Amount:</strong> $${(invoice.amount_cents / 100).toFixed(
          2,
        )} CAD</p>
      `,
    });

    // 3️⃣ Marcar como sent
    const { data: updated, error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ invoice: updated });
  } catch (err) {
    console.error("❌ Send invoice error:", err);

    return NextResponse.json(
      { error: "Failed to send invoice" },
      { status: 500 },
    );
  }
}
