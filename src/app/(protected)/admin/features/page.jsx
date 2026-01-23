"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export default function AdminFeaturesPage() {
  const { user, isLoaded } = useUser();
  const [rentalsEnabled, setRentalsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (user?.publicMetadata?.role !== "admin") {
      toast.error("Unauthorized");
      return;
    }

    fetch("/api/app-settings")
      .then((res) => res.json())
      .then((data) => {
        setRentalsEnabled(!!data.rentals_enabled);
        setLoading(false);
      });
  }, [isLoaded]);

  async function toggleRentals(value) {
    try {
      const res = await fetch("/api/admin/app-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentals_enabled: value }),
      });

      if (!res.ok) throw new Error();

      setRentalsEnabled(value);
      toast.success(value ? "Rentals enabled" : "Rentals disabled");
    } catch {
      toast.error("Failed to update rentals setting");
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">🧩 Features</h1>

      <div className="card p-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Rentals</h2>
          <p className="text-sm text-muted-foreground">
            Enable or disable the public rentals section.
          </p>
        </div>

        <Switch
          checked={rentalsEnabled}
          onCheckedChange={toggleRentals}
          disabled={loading}
        />
      </div>
    </div>
  );
}
