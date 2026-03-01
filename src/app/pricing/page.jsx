"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const [loading, setLoading] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const router = useRouter();

  const plans = [
    {
      name: "Starter",
      price: 79,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
      description: "Perfect for small cleaning teams or solo operators.",
      features: [
        "Up to 10 properties",
        "Job management",
        "Before/after photos",
        "Basic invoicing",
        "Email support",
      ],
    },
    {
      name: "Growth",
      price: 149,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH,
      popular: true,
      description: "Best for growing property management companies.",
      features: [
        "Unlimited properties",
        "Staff & role permissions",
        "Job timer & tracking",
        "Invoices & expenses",
        "Multi-company support",
        "Priority support",
      ],
    },
    {
      name: "Scale",
      price: 249,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SCALE,
      description: "Advanced features for large teams & operations.",
      features: [
        "Everything in Growth",
        "Advanced analytics",
        "Custom branding",
        "Dedicated support",
        "API access",
      ],
    },
  ];

  async function subscribe(priceId) {
    try {
      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }

      setLoading(priceId);

      const token = await getToken();

      const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Server error");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-white py-24 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-950">
          Choose the Plan That Fits Your Business
        </h1>

        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          Flexible pricing designed for cleaning and property management
          companies of all sizes.
        </p>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.name;

            return (
              <div
                key={plan.name}
                onClick={() => setSelectedPlan(plan.name)}
                className={`
                  relative rounded-2xl p-8 border cursor-pointer
                  transition-all duration-300 transform
                  ${
                    isSelected
                      ? "bg-blue-50 border-blue-900 shadow-2xl scale-105"
                      : plan.popular
                        ? "bg-blue-50 border-blue-900 shadow-xl"
                        : "bg-white border-gray-200 shadow-md"
                  }
                  hover:shadow-2xl hover:-translate-y-1 hover:border-blue-900
                `}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-900 text-white text-xs px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <h2 className="text-2xl font-semibold text-blue-950">
                  {plan.name}
                </h2>

                <div className="mt-6">
                  <span className="text-5xl font-bold text-blue-950">
                    ${plan.price}
                  </span>
                  <span className="text-gray-500 text-lg"> / month</span>
                </div>

                <p className="mt-4 text-gray-600 text-sm">{plan.description}</p>

                <ul className="mt-8 space-y-3 text-left">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 text-gray-700"
                    >
                      <Check size={18} className="text-blue-900" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 👈 evita que el click del botón seleccione la card
                    subscribe(plan.priceId);
                  }}
                  disabled={loading === plan.priceId || !plan.priceId}
                  className={`mt-8 w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                    isSelected
                      ? "bg-blue-900 text-white hover:bg-blue-800"
                      : "bg-blue-950 text-white hover:bg-blue-900"
                  } disabled:opacity-50`}
                >
                  {loading === plan.priceId
                    ? "Processing..."
                    : !plan.priceId
                      ? "Not Available"
                      : "Start Subscription"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
