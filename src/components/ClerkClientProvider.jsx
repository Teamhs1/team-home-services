"use client";

import { ClerkProvider } from "@clerk/nextjs";

export default function ClerkClientProvider({ children }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
