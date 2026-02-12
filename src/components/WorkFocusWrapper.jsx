"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import WorkFocusPlayer from "./WorkFocusPlayer";

export default function WorkFocusWrapper() {
  const { user } = useUser();
  const pathname = usePathname();

  const role = user?.publicMetadata?.role;

  // Solo staff
  if (role !== "staff") return null;

  // Solo dentro de páginas de job
  if (!pathname.startsWith("/jobs/")) return null;

  return <WorkFocusPlayer />;
}
