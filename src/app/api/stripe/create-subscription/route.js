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
    // 🔐 1️⃣ Verificar autenticación correctamente
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 📦 2️⃣ Obtener priceId del body
    const { priceId } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    // 🔎 3️⃣ Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const companyId = profile.company_id;

    // 🔎 4️⃣ Obtener company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    let customerId = company.stripe_customer_id;

    // 🧾 5️⃣ Crear customer si no existe
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: company.name,
        email: company.email,
        metadata: {
          companyId: companyId,
          clerkUserId: userId,
        },
      });

      customerId = customer.id;

      await supabase
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", companyId);
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // 💳 6️⃣ Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?subscribed=true`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        companyId: companyId,
        clerkUserId: userId,
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
