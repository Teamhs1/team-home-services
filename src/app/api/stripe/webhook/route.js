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
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      /* ============================================
         ✅ PAYMENT INTENT SUCCEEDED (FUENTE REAL)
      ============================================ */
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        if (paymentIntent.status !== "succeeded") return;

        const invoiceId = paymentIntent.metadata?.invoice_id;

        console.log("🔥 payment_intent.succeeded received");
        console.log("Metadata:", paymentIntent.metadata);

        if (!invoiceId) {
          console.warn("⚠️ No invoice_id in metadata");
          break;
        }

        // 🚫 Prevent duplicate processing (important!)
        const { data: existingPayment } = await supabase
          .from("payments")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .maybeSingle();

        if (existingPayment) {
          console.log("⚠️ Payment already recorded. Skipping.");
          break;
        }

        /* =========================
           1️⃣ INSERT PAYMENT RECORD
        ========================= */
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

        console.log("Payment insert error:", paymentError);

        /* =========================
           2️⃣ UPDATE INVOICE
        ========================= */
        const { error: invoiceError } = await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("id", invoiceId);

        console.log("Invoice update error:", invoiceError);

        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
