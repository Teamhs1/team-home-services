"use client";

import { Button } from "@/components/ui/button";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-24">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">See TeamOS in Action</h1>

        <p className="text-zinc-400 max-w-2xl mx-auto mb-12">
          TeamOS helps property managers organize properties, units, cleaning
          teams, maintenance requests and invoices from one powerful platform.
        </p>

        <div className="aspect-video bg-zinc-900 rounded-xl flex items-center justify-center mb-12">
          <p className="text-zinc-500">Demo video coming soon</p>
        </div>

        <Button
          size="lg"
          className="px-8 bg-blue-600"
          onClick={() => (window.location.href = "/early-access")}
        >
          Request Early Access
        </Button>
      </div>
    </main>
  );
}
