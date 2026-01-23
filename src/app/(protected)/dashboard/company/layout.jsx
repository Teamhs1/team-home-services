"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CompanyLayout({ children }) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Overview",
      href: "/dashboard/company",
      match: pathname === "/dashboard/company",
    },
    {
      name: "Members",
      href: "/dashboard/company/members",
      match: pathname.startsWith("/dashboard/company/members"),
    },
    {
      name: "Properties",
      href: "/dashboard/company/properties",
      match: pathname.startsWith("/dashboard/company/properties"),
    },
    {
      name: "Units",
      href: "/dashboard/company/units",
      match: pathname.startsWith("/dashboard/company/units"),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Company Tabs */}
      <div className="border-b pt-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-3 text-sm font-medium transition-colors ${
                tab.match
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Page Content */}
      <div className="pt-4">{children}</div>
    </div>
  );
}
