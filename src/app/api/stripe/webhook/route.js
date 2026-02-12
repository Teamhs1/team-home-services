// app/api/stripe/webhook/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

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
    /* =========================
       CHECKOUT COMPLETED
    ========================= */
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("SESSION METADATA:", session.metadata);

      console.log("✅ checkout.session.completed received");

      const invoiceId = session.metadata?.invoice_id;

      if (!invoiceId) {
        console.warn("⚠️ No invoice_id in metadata");
        return NextResponse.json({ received: true });
      }

      await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_session_id: session.id,
        })
        .eq("id", invoiceId);

      console.log("💰 Invoice marked as paid:", invoiceId);
    }

    /* =========================
       PAYMENT INTENT SUCCEEDED
    ========================= */
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;

      console.log("✅ payment_intent.succeeded received");

      const invoiceId = paymentIntent.metadata?.invoice_id;

      if (!invoiceId) {
        console.warn("⚠️ No invoice_id in metadata (payment_intent)");
        return NextResponse.json({ received: true });
      }

      await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      console.log("💰 Invoice marked as paid (PI):", invoiceId);
    }
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
