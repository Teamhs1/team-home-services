// app/api/stripe/webhook/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  const body = await req.text();
  const sig = headers().get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("❌ Stripe signature error:", err.message);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    /* =====================================================
       ✅ PAYMENT INTENT SUCCEEDED  (ÚNICA FUENTE DE VERDAD)
    ===================================================== */
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;

      if (paymentIntent.status !== "succeeded") {
        return NextResponse.json({ received: true });
      }

      const invoiceId = paymentIntent.metadata?.invoice_id;

      if (!invoiceId) {
        console.warn("⚠️ Missing invoice_id in metadata");
        return NextResponse.json({ received: true });
      }

      console.log("💳 Processing payment for invoice:", invoiceId);

      /* ===============================
         1️⃣ PREVENT DUPLICATES
      =============================== */
      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .maybeSingle();

      if (existing) {
        console.log("⚠️ Payment already processed. Skipping.");
        return NextResponse.json({ received: true });
      }

      /* ===============================
         2️⃣ INSERT PAYMENT RECORD
      =============================== */
      const { error: paymentError } = await supabase.from("payments").insert({
        invoice_id: invoiceId,
        company_id: paymentIntent.metadata?.company_id || null,
        amount_cents: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: "succeeded",
        stripe_payment_intent_id: paymentIntent.id,
        stripe_charge_id: paymentIntent.latest_charge || null,
        stripe_event_id: event.id,
      });

      if (paymentError) {
        console.error("❌ Payment insert failed:", paymentError);
        return new NextResponse("Payment insert failed", { status: 500 });
      }

      /* ===============================
         3️⃣ UPDATE INVOICE
      =============================== */
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (invoiceError) {
        console.error("❌ Invoice update failed:", invoiceError);
        return new NextResponse("Invoice update failed", { status: 500 });
      }

      console.log("✅ Invoice marked as paid:", invoiceId);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return new NextResponse("Webhook failed", { status: 500 });
  }
}
