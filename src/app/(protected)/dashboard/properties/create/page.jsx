"use client";

import { useState } from "react";
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

      if (!res.ok) {
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
    </main>
  );
}
