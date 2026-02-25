"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export default function AdminFeaturesPage() {
  const { user, isLoaded } = useUser();
  const [rentalsEnabled, setRentalsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const role = user?.publicMetadata?.role;

    if (!["admin", "super_admin"].includes(role)) {
      toast.error("Unauthorized");
      setLoading(false);
      return;
    }

    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/app-settings");

        if (!res.ok) {
          const text = await res.text();
          console.error("LOAD ERROR:", text);
          throw new Error(text);
        }

        const data = await res.json();
        setRentalsEnabled(!!data.rentals_enabled);
      } catch (err) {
        toast.error("Failed to load app settings");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [isLoaded, user]);

  async function toggleRentals(value) {
    try {
      setUpdating(true);

      const res = await fetch("/api/admin/app-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentals_enabled: value }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("UPDATE ERROR:", text);
        throw new Error(text);
      }

      setRentalsEnabled(value);
      toast.success(value ? "Rentals enabled" : "Rentals disabled");
    } catch (err) {
      toast.error("Failed to update rentals setting");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <main className="pt-[100px] px-6">
      <div className="max-w-3xl space-y-6">
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
            disabled={loading || updating}
          />
        </div>
      </div>
    </main>
  );
}
