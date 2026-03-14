"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export function useAppContext() {
  const { isLoaded } = useUser();

  const [role, setRole] = useState(null);
  const [billingEnabled, setBillingEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    async function loadContext() {
      try {
        const [billingRes, profileRes] = await Promise.all([
          fetch("/api/company/billing", { credentials: "include" }),
          fetch("/api/my/profile", { credentials: "include" }),
        ]);

        if (billingRes.ok) {
          const billing = await billingRes.json();
          setBillingEnabled(billing.billing_enabled ?? true);
        }

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setRole(profile.role ?? null);
        }
      } catch (err) {
        console.error("APP CONTEXT ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    loadContext();
  }, [isLoaded]);

  return {
    role,
    billingEnabled,
    loading,
    isAdmin: role === "admin" || role === "super_admin",
  };
}
