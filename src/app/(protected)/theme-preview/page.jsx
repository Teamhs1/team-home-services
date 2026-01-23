"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ThemePreviewRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // ✅ ADMIN → usa el editor real que ya existe
    if (user?.publicMetadata?.role === "admin") {
      router.replace("/admin/theme-preview");
      return;
    }

    // 👀 NO ADMIN → preview público simple
    router.replace("/theme-preview/public");
  }, [isLoaded, user, router]);

  return null;
}
