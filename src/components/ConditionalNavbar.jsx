"use client";

import GlobalNavbar from "@/components/GlobalNavbar";

/**
 * Siempre mostramos el GlobalNavbar.
 * GlobalNavbar ya maneja lógica interna de sidebar y sesión.
 */
export default function ConditionalNavbar() {
  return <GlobalNavbar />;
}
