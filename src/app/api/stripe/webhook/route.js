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

  /* =========================
     HANDLE EVENTS
  ========================= */
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        const invoiceId = session.metadata?.invoice_id;
        if (!invoiceId) break;

        // ✅ mark invoice as paid
        const { data, error } = await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_session_id: session.id,
          })
          .eq("id", invoiceId)
          .select();

        console.log("INVOICE ID:", invoiceId);
        console.log("UPDATE DATA:", data);
        console.log("UPDATE ERROR:", error);

        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
