import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { auth, currentUser } from "@clerk/nextjs/server";

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

    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || undefined;

    const { priceId } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    // 🔎 Buscar profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json(
        { error: "You must create a company before subscribing." },
        { status: 400 },
      );
    }

    const companyId = profile.active_company_id;

    // 🔎 Validar que sea owner
    const { data: membership } = await supabase
      .from("company_members")
      .select("role")
      .eq("company_id", companyId)
      .eq("profile_id", profile.id)
      .single();

    if (!membership || membership.role !== "owner") {
      return NextResponse.json(
        { error: "Only the company owner can manage billing." },
        { status: 403 },
      );
    }

    // 🔎 Obtener company
    const { data: company } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    let customerId = company.stripe_customer_id;

    // 🧾 Crear customer si no existe
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: company.name,
        email: userEmail,
        metadata: {
          companyId,
        },
      });

      customerId = customer.id;

      await supabase
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", companyId);
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // 💳 Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/company?subscribed=true`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        companyId, // 🔥 SIEMPRE
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("❌ Subscription creation error:", err);

    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
