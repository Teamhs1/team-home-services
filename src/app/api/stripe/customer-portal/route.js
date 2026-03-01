import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ===============================
       🔎 Get active company
    =============================== */

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile?.active_company_id) {
      return NextResponse.json(
        { error: "No active company found" },
        { status: 400 },
      );
    }

    const companyId = profile.active_company_id;

    /* ===============================
       💳 Get Stripe customer
    =============================== */

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("stripe_customer_id")
      .eq("id", companyId)
      .single();

    if (companyError || !company?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer configured" },
        { status: 400 },
      );
    }

    /* ===============================
       🌍 Determine Base URL
    =============================== */

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://teamhomeservices.ca"
        : "http://localhost:3000");

    /* ===============================
       🚀 Create Billing Portal Session
    =============================== */

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${baseUrl}/dashboard/company`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("STRIPE CUSTOMER PORTAL ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Stripe portal error" },
      { status: 500 },
    );
  }
}
