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

  // 🔐 Subscription check
  useEffect(() => {
    async function checkSubscription() {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_company_id, role")
        .eq("clerk_id", user.id)
        .single();

      // 👑 SUPER ADMIN SIEMPRE PERMITIDO
      if (profile?.role === "super_admin") {
        setAllowed(true);
        return;
      }

      // 🔵 ADMIN TAMBIÉN PERMITIDO (si así lo deseas)
      if (profile?.role === "admin") {
        setAllowed(true);
        return;
      }

      // 🔒 Usuarios normales necesitan company activa
      if (!profile?.active_company_id) {
        router.replace("/pricing");
        return;
      }

      const { data: company } = await supabase
        .from("companies")
        .select("subscription_status")
        .eq("id", profile.active_company_id)
        .single();

      const allowedStatuses = ["active", "trialing"];

      if (!allowedStatuses.includes(company?.subscription_status)) {
        router.replace("/pricing");
        return;
      }

      setAllowed(true);
    }

    checkSubscription();
  }, [user]);

  if (!allowed) return null;

  // 📌 Solo aplicar margen en pantallas grandes
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
