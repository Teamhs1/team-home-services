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
      /* =========================
         CHECKOUT COMPLETED
      ========================= */
      case "checkout.session.completed": {
        const session = event.data.object;
        const invoiceId = session.metadata?.invoice_id;

        console.log("🔥 checkout.session.completed received");
        console.log("Metadata:", session.metadata);

        if (!invoiceId) {
          console.warn("⚠️ No invoice_id in checkout.session metadata");
          break;
        }

        const { data, error } = await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_session_id: session.id,
          })
          .eq("id", invoiceId)
          .select();

        console.log("Invoice updated (checkout):", invoiceId);
        console.log("Update data:", data);
        console.log("Update error:", error);

        break;
      }

      /* =========================
         PAYMENT INTENT SUCCEEDED
      ========================= */
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const invoiceId = paymentIntent.metadata?.invoice_id;

        console.log("🔥 payment_intent.succeeded received");
        console.log("Metadata:", paymentIntent.metadata);

        if (!invoiceId) {
          console.warn("⚠️ No invoice_id in payment_intent metadata");
          break;
        }

        const { data, error } = await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("id", invoiceId)
          .select();

        console.log("Invoice updated (payment_intent):", invoiceId);
        console.log("Update data:", data);
        console.log("Update error:", error);

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
