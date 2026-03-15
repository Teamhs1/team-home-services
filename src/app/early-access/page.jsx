"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function EarlyAccessPage() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    await supabase.from("early_access").insert({
      email,
      company,
    });

    setEmail("");
    setCompany("");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-24">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">Get Early Access to TeamOS</h1>

        <p className="text-zinc-400 mb-10">
          Join the waitlist and be the first to try TeamOS.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-3 rounded bg-zinc-900 border border-zinc-700"
            placeholder="Company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />

          <input
            className="w-full p-3 rounded bg-zinc-900 border border-zinc-700"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button type="submit" size="lg" className="w-full bg-blue-600">
            {loading ? "Joining..." : "Join Waitlist"}
          </Button>
        </form>
      </div>
    </main>
  );
}
