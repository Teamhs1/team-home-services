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

/* ============================================================
   🔥 PLAN MAPPING
============================================================ */

function mapPriceToPlan(priceId) {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_GROWTH) return "growth";
  if (priceId === process.env.STRIPE_PRICE_SCALE) return "scale";
  return null;
}

function mapPlanToUnits(priceId) {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 10;
  if (priceId === process.env.STRIPE_PRICE_GROWTH) return 9999;
  if (priceId === process.env.STRIPE_PRICE_SCALE) return 9999;
  return 0;
}

/* ============================================================
   🔥 WEBHOOK HANDLER
============================================================ */

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
      /* ============================================================
         ✅ CHECKOUT COMPLETED (NEW SUBSCRIPTION)
      ============================================================ */

      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode !== "subscription") break;

        const companyId = session.metadata?.companyId;
        if (!companyId) break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription,
        );

        const priceId = subscription.items.data[0]?.price?.id;

        await supabase
          .from("companies")
          .update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            plan_type: mapPriceToPlan(priceId),
            max_units: mapPlanToUnits(priceId),
            cancel_at_period_end: subscription.cancel_at_period_end || false,
            subscription_current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
            billing_enabled:
              subscription.status === "active" ||
              subscription.status === "trialing",
          })
          .eq("id", companyId);

        console.log("✅ Subscription created");
        break;
      }

      /* ============================================================
         🔄 SUBSCRIPTION UPDATED
      ============================================================ */

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const priceId = subscription.items.data[0]?.price?.id;

        await supabase
          .from("companies")
          .update({
            subscription_status: subscription.status,
            plan_type: mapPriceToPlan(priceId),
            max_units: mapPlanToUnits(priceId),
            cancel_at_period_end: subscription.cancel_at_period_end || false,
            subscription_current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
            billing_enabled:
              subscription.status === "active" ||
              subscription.status === "trialing",
          })
          .eq("stripe_subscription_id", subscription.id);

        console.log(
          "🔄 Subscription synced:",
          subscription.status,
          "period_end:",
          subscription.current_period_end,
        );
        break;
      }

      /* ============================================================
         ❌ SUBSCRIPTION FULLY CANCELED
      ============================================================ */

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        await supabase
          .from("companies")
          .update({
            subscription_status: "canceled",
            plan_type: null,
            max_units: 0,
            cancel_at_period_end: false,
            subscription_current_period_end: null,
            billing_enabled: false,
          })
          .eq("stripe_subscription_id", subscription.id);

        console.log("⚠️ Subscription fully canceled");
        break;
      }

      /* ============================================================
         💳 PAYMENT FAILED
      ============================================================ */

      case "invoice.payment_failed": {
        const invoice = event.data.object;

        await supabase
          .from("companies")
          .update({
            subscription_status: "past_due",
            billing_enabled: false,
          })
          .eq("stripe_customer_id", invoice.customer);

        console.log("⚠️ Payment failed");
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
