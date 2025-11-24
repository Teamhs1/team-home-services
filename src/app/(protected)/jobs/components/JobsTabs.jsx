"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function JobsTabs() {
  const pathname = usePathname();

  const tabs = [
    { label: "All Jobs", href: "/jobs" },
    { label: "Completed", href: "/jobs/completed" },
    { label: "Pending", href: "/jobs/pending" },
    { label: "In Progress", href: "/jobs/in-progress" },
  ];

  return (
    <div className="flex gap-6 border-b pb-2 mb-6 text-sm font-medium">
      {tabs.map((t) => {
        const isActive = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`pb-2 ${
              isActive
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
