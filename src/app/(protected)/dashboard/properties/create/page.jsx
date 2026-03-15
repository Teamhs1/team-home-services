"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function DashboardCreatePropertyPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [unit, setUnit] = useState("");
  const [saving, setSaving] = useState(false);

  const [limitModal, setLimitModal] = useState(null);

  /* =====================
     BILLING + ROLE
  ===================== */

  const [billingEnabled, setBillingEnabled] = useState(true);
  const [role, setRole] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);

  const isAdmin = role === "admin" || role === "super_admin";

  useEffect(() => {
    async function loadContext() {
      try {
        const [billingRes, profileRes] = await Promise.all([
          fetch("/api/company/billing", { credentials: "include" }),
          fetch("/api/my/profile", { credentials: "include" }),
        ]);

        if (billingRes.ok) {
          const billing = await billingRes.json();
          setBillingEnabled(billing.billing_enabled ?? true);
        }

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setRole(profile.role ?? null);
        }
      } catch (err) {
        console.error("LOAD CONTEXT ERROR:", err);
      } finally {
        setLoadingContext(false);
      }
    }

    loadContext();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name || !address) {
      toast.error("Property name and address are required");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/dashboard/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          unit: unit || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      console.log("PLAN RESPONSE:", data);
      if (!res.ok) {
        console.log("API ERROR:", data);

        if (data?.upgradeRequired) {
          setLimitModal({
            limit: data.limit ?? 6,
            plan: data.plan ?? "Unknown",
            type: "properties",
          });

          setSaving(false);
          return;
        }

        toast.error(data?.error || "Failed to create property");
        setSaving(false);
        return;
      }

      toast.success("Property created successfully");
      router.push("/dashboard/properties");
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error creating property");
    } finally {
      setSaving(false);
    }
  }

  /* =====================
     LOADING
  ===================== */

  if (loadingContext) {
    return (
      <main className="px-4 sm:px-6 pt-[130px] max-w-3xl mx-auto text-center text-gray-500">
        Loading...
      </main>
    );
  }

  /* =====================
     BILLING DISABLED
  ===================== */

  if (!billingEnabled && !isAdmin) {
    return (
      <main className="px-4 sm:px-6 pt-[150px] max-w-xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-full bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-xl">
            Billing is disabled for this company. Properties cannot be created.
          </div>

          <Link href="/dashboard/properties">
            <Button variant="outline" className="px-6">
              Back to properties
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 sm:px-6 pt-[130px] max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <Link
          href="/dashboard/properties"
          className="text-sm text-gray-500 hover:underline"
        >
          ← Back to properties
        </Link>

        <h1 className="mt-2 text-3xl font-bold">Add Property</h1>
        <p className="text-gray-600 mt-1">
          This property will be assigned to your company automatically.
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-2xl shadow-sm p-6 space-y-6"
      >
        {/* NAME */}
        <div className="space-y-1.5">
          <Label>Property Name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dominion Apartments"
          />
        </div>

        {/* ADDRESS */}
        <div className="space-y-1.5">
          <Label>Address *</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Moncton NB"
          />
        </div>

        {/* UNIT */}
        <div className="space-y-1.5">
          <Label>Unit (optional)</Label>
          <Input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Unit 3B"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Property
          </Button>

          <Link href="/dashboard/properties">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
        </div>
      </form>

      {/* PLAN LIMIT MODAL */}

      {limitModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h2 className="text-xl font-semibold">Plan limit reached</h2>

            <p className="text-sm text-gray-600">
              Your{" "}
              <b>
                {limitModal.plan?.charAt(0).toUpperCase() +
                  limitModal.plan?.slice(1)}
              </b>{" "}
              plan allows up to <b>{limitModal.limit}</b> {limitModal.type}.
            </p>

            <p className="text-sm text-gray-600">
              Upgrade your plan to create more.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setLimitModal(null)}>
                Close
              </Button>

              <Button onClick={() => router.push("/pricing?reason=unit-limit")}>
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
