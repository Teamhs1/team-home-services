"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useSidebar } from "@/components/SidebarContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function ProtectedLayoutClient({ children }) {
  const { isSidebarOpen } = useSidebar?.() || {};
  const { user } = useUser();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      if (!user) return;

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, role, active_company_id")
          .eq("clerk_id", user.id)
          .single();

        if (error || !profile) {
          console.error("Profile error:", error);
          router.replace("/pricing");
          return;
        }

        const isSuperAdmin = profile.role === "super_admin";
        const isDev = process.env.NODE_ENV === "development";

        // 👑 SUPER ADMIN siempre permitido
        if (isSuperAdmin) {
          setAllowed(true);
          return;
        }

        // 🧪 En desarrollo no bloqueamos a nadie
        if (isDev) {
          setAllowed(true);
          return;
        }

        // 🔒 Si no tiene compañía activa → pricing
        if (!profile.active_company_id) {
          router.replace("/pricing");
          return;
        }

        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("subscription_status")
          .eq("id", profile.active_company_id)
          .single();

        if (companyError || !company) {
          console.error("Company error:", companyError);
          router.replace("/pricing");
          return;
        }

        const allowedStatuses = ["active", "trialing"];

        if (!allowedStatuses.includes(company.subscription_status)) {
          router.replace("/pricing");
          return;
        }

        setAllowed(true);
      } catch (err) {
        console.error("Subscription check error:", err);
        router.replace("/pricing");
      }
    }

    checkSubscription();
  }, [user]);

  if (!allowed) return null;

  const marginLeft =
    typeof window !== "undefined" && window.innerWidth >= 768
      ? isSidebarOpen
        ? "16rem"
        : "5rem"
      : "0";

  return (
    <div
      className="flex flex-col flex-1 transition-all duration-300"
      style={{ marginLeft }}
    >
      {children}
    </div>
  );
}
