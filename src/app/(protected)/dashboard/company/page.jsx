"use client";

import { useEffect, useState } from "react";
import CompanySection from "@/components/company/CompanySection";

export default function CompanyPage() {
  const [propertyCount, setPropertyCount] = useState("—");

  useEffect(() => {
    let mounted = true;

    async function loadPropertyCount() {
      try {
        const res = await fetch("/api/dashboard/properties", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          if (mounted) setPropertyCount(0);
          return;
        }

        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];

        if (mounted) setPropertyCount(list.length);
      } catch (err) {
        console.error("COMPANY PROPERTY COUNT ERROR:", err);
        if (mounted) setPropertyCount(0);
      }
    }

    loadPropertyCount();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <CompanySection>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Company Overview
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage company information and settings.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 mt-10">
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Members</p>
          <p className="text-2xl font-semibold mt-1">2</p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Properties</p>
          <p className="text-2xl font-semibold mt-1">{propertyCount}</p>
        </div>
      </div>
    </CompanySection>
  );
}
