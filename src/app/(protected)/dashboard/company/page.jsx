"use client";

import { useEffect, useState } from "react";
import CompanySection from "@/components/company/CompanySection";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CompanyPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [noCompany, setNoCompany] = useState(false);

  const [companyId, setCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [createdAt, setCreatedAt] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const [propertyCount, setPropertyCount] = useState(0);
  const [logo, setLogo] = useState(null);

  const [planType, setPlanType] = useState("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [billingEnabled, setBillingEnabled] = useState(false);

  /* =========================
     LOAD COMPANY OVERVIEW
  ========================= */
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/company/overview", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          console.error(data.error);
          setLoading(false);
          return;
        }

        if (data.no_company) {
          setNoCompany(true);
          setLoading(false);
          return;
        }

        setCompanyId(data.company_id);
        setCompanyName(data.company_name);
        setCreatedAt(data.created_at);
        setMemberCount(data.members);
        setPropertyCount(data.properties);

        setLogo(data.logo ? `${data.logo}?v=${Date.now()}` : null);

        setPlanType(data.plan_type || "free");
        setSubscriptionStatus(data.subscription_status);
        setBillingEnabled(data.billing_enabled);

        setLoading(false);
      } catch (err) {
        console.error("COMPANY INIT ERROR:", err);
        setLoading(false);
      }
    }

    init();
  }, []);

  /* =========================
     LOGO UPLOAD (PURE API)
  ========================= */
  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyId", companyId);

      const res = await fetch("/api/company/upload-logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.error);
        return;
      }

      // Update UI instantly
      setLogo(`${data.url}?v=${Date.now()}`);
    } catch (err) {
      console.error("LOGO UPLOAD ERROR:", err);
    }
  }

  /* =========================
     OPEN STRIPE PORTAL
  ========================= */
  async function openCustomerPortal() {
    try {
      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST",
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("PORTAL ERROR:", err);
    }
  }

  /* =========================
     CREATE COMPANY SCREEN
  ========================= */
  if (!loading && noCompany) {
    return (
      <CompanySection>
        <div className="mt-12 max-w-xl">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create Your Company
          </h1>

          <p className="text-muted-foreground mt-3">
            Your workspace is required before selecting a plan.
          </p>

          <button
            onClick={() => router.push("/dashboard/company/create")}
            className="mt-6 px-6 py-3 bg-black text-white rounded-lg hover:opacity-90 transition"
          >
            Create Company
          </button>
        </div>
      </CompanySection>
    );
  }

  if (loading) {
    return (
      <CompanySection>
        <div className="mt-10">Loading...</div>
      </CompanySection>
    );
  }

  const isActive =
    subscriptionStatus === "active" || subscriptionStatus === "trialing";

  return (
    <CompanySection>
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{companyName}</h1>

        {createdAt && (
          <p className="text-sm text-muted-foreground mt-1">
            Created on {new Date(createdAt).toLocaleDateString("en-CA")}
          </p>
        )}

        <p className="text-muted-foreground mt-2">
          Manage company information and billing.
        </p>
      </div>

      {/* LOGO */}
      <div className="mt-8 flex items-center gap-6">
        <div className="relative">
          {logo ? (
            <Image
              src={logo}
              alt="Company Logo"
              width={140}
              height={140}
              className="rounded-xl border object-contain bg-white p-2"
            />
          ) : (
            <div className="w-[140px] h-[140px] rounded-xl border flex items-center justify-center text-sm text-muted-foreground">
              No Logo
            </div>
          )}

          <label className="absolute bottom-2 right-2 bg-black text-white text-xs px-3 py-1 rounded cursor-pointer hover:opacity-90">
            Change
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-10">
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Members</p>
          <p className="text-2xl font-semibold mt-1">{memberCount}</p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Properties</p>
          <p className="text-2xl font-semibold mt-1">{propertyCount}</p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Plan</p>

          <p className="text-xl font-semibold mt-2 capitalize">{planType}</p>

          <p
            className={`text-sm mt-1 ${
              isActive ? "text-green-600" : "text-muted-foreground"
            }`}
          >
            {subscriptionStatus || "Free Plan"}
          </p>

          {isActive ? (
            <button
              onClick={openCustomerPortal}
              className="mt-4 px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90 transition"
            >
              Manage Subscription
            </button>
          ) : (
            <button
              onClick={() => router.push("/pricing")}
              className="mt-4 px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90 transition"
            >
              Upgrade Plan
            </button>
          )}
        </div>
      </div>
    </CompanySection>
  );
}
