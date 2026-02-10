import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

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

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(
        `
        id,
        type,
        amount_cents,
        status,
        properties ( address )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status !== "sent") {
      return NextResponse.json(
        { error: "Invoice not payable" },
        { status: 400 },
      );
    }

    if (!invoice.amount_cents || invoice.amount_cents <= 0) {
      return NextResponse.json(
        { error: "Invalid invoice amount" },
        { status: 400 },
      );
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json(
        { error: "App URL not configured" },
        { status: 500 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: `${invoice.type} invoice`,
              description: invoice.properties?.address || "",
            },
            unit_amount: invoice.amount_cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${id}?paid=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${id}`,
      metadata: {
        invoice_id: invoice.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to start Stripe checkout" },
      { status: 500 },
    );
  }
}
