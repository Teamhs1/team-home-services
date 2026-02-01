// src/app/api/invoices/[id]/send/route.js
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // 1️⃣ Obtener invoice
    const { data: invoice } = await supabase
      .from("invoices")
      .select(
        `
        id,
        amount_cents,
        properties ( address )
      `,
      )
      .eq("id", id)
      .single();

    // 2️⃣ Enviar email
    await resend.emails.send({
      from: "Team Home Services <invoices@teamhomeservices.ca>",
      to: ["tuemail@gmail.com"], // luego será el cliente
      subject: "Your invoice from Team Home Services",
      html: `
        <h2>Invoice</h2>
        <p>Property: ${invoice.properties.address}</p>
        <p>Amount: $${(invoice.amount_cents / 100).toFixed(2)} CAD</p>
      `,
    });

    // 3️⃣ Marcar como sent
    const { data: updated } = await supabase
      .from("invoices")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    return NextResponse.json({ invoice: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to send invoice" },
      { status: 500 },
    );
  }
}
