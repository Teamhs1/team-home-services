"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useAuth, useUser } from "@clerk/nextjs";

export default function AdminFeaturesPage() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  const [settingsId, setSettingsId] = useState(null);
  const [rentalsEnabled, setRentalsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  async function getSupabaseClient() {
    const token = await getToken({ template: "supabase" });
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    );
  }

  useEffect(() => {
    if (!isLoaded) return;

    const role = user?.publicMetadata?.role;
    if (role !== "admin") {
      toast.error("Unauthorized");
      return;
    }

    loadSettings();
  }, [isLoaded]);

  async function loadSettings() {
    setLoading(true);

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("id, rentals_enabled")
      .single();

    if (error) {
      toast.error("Failed to load app settings");
      setLoading(false);
      return;
    }

    setSettingsId(data.id);
    setRentalsEnabled(!!data.rentals_enabled);
    setLoading(false);
  }

  async function toggleRentals(value) {
    if (!settingsId) return;

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("app_settings")
      .update({ rentals_enabled: value })
      .eq("id", settingsId);

    if (error) {
      toast.error("Failed to update rentals setting");
      return;
    }

    setRentalsEnabled(value);
    toast.success(value ? "Rentals enabled" : "Rentals disabled");
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
