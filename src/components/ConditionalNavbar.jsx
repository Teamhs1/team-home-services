"use client";

import { usePathname } from "next/navigation";
import GlobalNavbar from "@/components/GlobalNavbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  const isProtected =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/jobs") ||
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/settings");

  // ✅ Mostrar navbar también en sign-in / sign-up
  if (!isProtected) {
    return <GlobalNavbar />;
  }

  return null;
}
