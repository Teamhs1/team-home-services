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
function mapPriceToPlan(priceId) {
  if (priceId === process.env.STRIPE_PRICE_GROWTH) return "growth";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return "unknown";
}

function mapPlanToUnits(priceId) {
  if (priceId === process.env.STRIPE_PRICE_GROWTH) return 25;
  if (priceId === process.env.STRIPE_PRICE_PRO) return 75;
  return 0;
}
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

        if (paymentIntent.status !== "succeeded") break;

        const invoiceId = paymentIntent.metadata?.invoice_id;

        console.log("🔥 payment_intent.succeeded received");
        console.log("Metadata:", paymentIntent.metadata);

        if (!invoiceId) {
          console.warn("⚠️ No invoice_id in metadata");
          break;
        }

        // 1️⃣ Obtener invoice
        const { data: invoiceData, error: invoiceFetchError } = await supabase
          .from("invoices")
          .select("company_id")
          .eq("id", invoiceId)
          .single();

        if (invoiceFetchError || !invoiceData) {
          console.error("❌ Could not fetch invoice:", invoiceFetchError);
          break;
        }

        console.log("Invoice company_id:", invoiceData.company_id);

        // 2️⃣ Prevent duplicate
        const { data: existingPayment } = await supabase
          .from("payments")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .maybeSingle();

        if (existingPayment) {
          console.log("⚠️ Payment already recorded. Skipping.");
          break;
        }

        // 3️⃣ Insert payment
        const { error: paymentError } = await supabase.from("payments").insert({
          invoice_id: invoiceId,
          company_id: invoiceData.company_id,
          amount_cents: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: "succeeded",
          stripe_payment_intent_id: paymentIntent.id,
          stripe_charge_id: paymentIntent.latest_charge || null,
          stripe_event_id: event.id,
        });

        if (paymentError) {
          console.error("❌ Payment insert failed:", paymentError);
          break; // 🚫 no marcar invoice si falla payment
        }

        console.log("✅ Payment inserted");

        // 4️⃣ Update invoice
        const { error: invoiceError } = await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("id", invoiceId);

        if (invoiceError) {
          console.error("❌ Invoice update failed:", invoiceError);
        } else {
          console.log("✅ Invoice marked as paid");
        }

        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object;

        if (session.mode !== "subscription") break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription,
        );

        const priceId = subscription.items.data[0].price.id;

        await supabase
          .from("companies")
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            plan_type: mapPriceToPlan(priceId),
            max_units: mapPlanToUnits(priceId),
            subscription_current_period_end: new Date(
              subscription.current_period_end * 1000,
            ),
          })
          .eq("stripe_customer_id", session.customer);

        console.log("✅ Subscription activated");
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        await supabase
          .from("companies")
          .update({
            subscription_status: "canceled",
            max_units: 0,
          })
          .eq("stripe_subscription_id", subscription.id);

        console.log("⚠️ Subscription canceled");
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;

        await supabase
          .from("companies")
          .update({
            subscription_status: "past_due",
          })
          .eq("stripe_customer_id", invoice.customer);

        console.log("⚠️ Subscription payment failed");
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;

        await supabase
          .from("companies")
          .update({
            subscription_status: subscription.status,
            subscription_current_period_end: new Date(
              subscription.current_period_end * 1000,
            ),
            stripe_subscription_id: subscription.id, // ← refuerzo
          })
          .eq("stripe_customer_id", subscription.customer);

        console.log("🔄 Subscription status synced:", subscription.status);
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
