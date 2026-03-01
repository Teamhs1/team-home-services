"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import CompanySection from "@/components/company/CompanySection";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

export default function CompanyPage() {
  const { getToken } = useAuth();

  const [propertyCount, setPropertyCount] = useState("—");
  const [memberCount, setMemberCount] = useState("—");
  const [logo, setLogo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [createdAt, setCreatedAt] = useState(null);

  // 🔥 NUEVO
  const [planType, setPlanType] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [billingEnabled, setBillingEnabled] = useState(false);

  /* =========================
     LOAD OVERVIEW FROM API
  ========================= */
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const res = await fetch("/api/company/overview", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          console.error(data.error);
          return;
        }

        if (mounted) {
          setCompanyId(data.company_id);
          setCompanyName(data.company_name);
          setCreatedAt(data.created_at);
          setMemberCount(data.members);
          setPropertyCount(data.properties);
          setLogo(data.logo);

          // 🔥 NUEVO
          setPlanType(data.plan_type);
          setSubscriptionStatus(data.subscription_status);
          setBillingEnabled(data.billing_enabled);
        }
      } catch (err) {
        console.error("COMPANY INIT ERROR:", err);
        if (mounted) {
          setPropertyCount(0);
          setMemberCount(0);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================
     OPEN STRIPE CUSTOMER PORTAL
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
     UPLOAD LOGO
  ========================= */
  async function uploadLogo(file) {
    try {
      if (!companyId) return;

      setUploading(true);

      const token = await getToken({ template: "supabase" });

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        },
      );

      const fileExt = file.name.split(".").pop();
      const fileName = `${companyId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);

      const logoUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: logoUrl })
        .eq("id", companyId);

      if (updateError) throw updateError;

      setLogo(logoUrl);
    } catch (err) {
      console.error("UPLOAD LOGO ERROR:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <CompanySection>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {companyName || "Company Overview"}
        </h1>

        {createdAt && (
          <p className="text-sm text-muted-foreground mt-1">
            Created on {new Date(createdAt).toLocaleDateString("en-CA")}
          </p>
        )}

        <p className="text-muted-foreground mt-2">
          Manage company information and settings.
        </p>
      </div>

      {/* Logo */}
      <div className="mt-8 flex items-center gap-6">
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

        <label className="cursor-pointer text-sm font-medium">
          {uploading ? "Uploading..." : "Upload Logo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                uploadLogo(e.target.files[0]);
              }
            }}
          />
        </label>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-10">
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Members</p>
          <p className="text-2xl font-semibold mt-1">{memberCount}</p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Properties</p>
          <p className="text-2xl font-semibold mt-1">{propertyCount}</p>
        </div>

        {/* 🔥 Subscription Card */}
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Subscription</p>

          <p className="text-xl font-semibold mt-2">
            {planType
              ? planType.charAt(0).toUpperCase() + planType.slice(1)
              : "No Plan"}
          </p>

          <p className="text-sm text-muted-foreground mt-1">
            Status: {subscriptionStatus || "—"}
          </p>

          {billingEnabled && (
            <button
              onClick={openCustomerPortal}
              className="mt-4 px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90 transition"
            >
              Manage Subscription
            </button>
          )}
        </div>
      </div>
    </CompanySection>
  );
}
