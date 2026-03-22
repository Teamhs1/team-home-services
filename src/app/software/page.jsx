"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Building2,
  Users,
  Wrench,
  BarChart3,
  Layers,
  CheckCircle,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function SoftwarePage() {
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const [hero, setHero] = useState({
    badge: "Built by Team Home Services",
    title: "TeamOS",
    description:
      "The operating system for property operations. Manage properties, units, cleaning teams, maintenance tasks and invoices from one powerful platform.",
    subtitle: "Built and used daily by Team Home Services in Moncton, NB",
  });

  /* =========================
     LOAD CONTENT
  ========================= */
  async function loadContent() {
    try {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", "software_hero")
        .single();

      if (error) {
        console.error("software hero error:", error);
        return;
      }

      if (data?.content) {
        setHero(data.content);
      }
    } catch (err) {
      console.error("software hero fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     INITIAL LOAD
  ========================= */
  useEffect(() => {
    loadContent();

    const channel = supabase
      .channel("software_hero_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_content" },
        (payload) => {
          if (payload.new.section === "software_hero") {
            setHero(payload.new.content);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="bg-black text-white min-h-[100vh]">
      {/* HERO */}
      <section className="relative max-w-7xl mx-auto px-6 pt-36 pb-32 text-center">
        <div className="absolute inset-0 -z-10 flex justify-center">
          <div className="w-[650px] h-[650px] bg-blue-600/20 blur-[160px] rounded-full" />
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="bg-blue-600/20 text-blue-400 text-xs px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles size={14} />
            {hero.badge}
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          {hero.title}
        </h1>

        <p className="mt-6 text-xl text-zinc-300 max-w-2xl mx-auto">
          {hero.description}
        </p>

        <p className="mt-4 text-sm text-zinc-500">{hero.subtitle}</p>

        <div className="flex justify-center gap-4 mt-10">
          <Button
            size="lg"
            className="px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            onClick={() => router.push("/early-access")}
          >
            Request Early Access
          </Button>

          <Button
            size="lg"
            className="px-8 bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-500"
            onClick={() => router.push("/demo")}
          >
            See Platform
          </Button>
        </div>

        {/* PRODUCT PREVIEW */}
        <div className="mt-16 flex justify-center">
          <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl shadow-blue-600/20">
            {/* Glow background */}
            <div className="absolute -inset-10 bg-blue-600/10 blur-3xl"></div>

            {/* Screenshot */}
            <Image
              src="/images/teamos-dashboard.png"
              alt="TeamOS dashboard"
              width={1200}
              height={700}
              className="relative w-full max-w-5xl rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-zinc-950 py-28 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold">
            Property operations are fragmented
          </h2>

          <p className="mt-6 text-zinc-400 leading-relaxed">
            Property managers and service companies rely on multiple tools to
            run their operations — spreadsheets, emails, messaging apps and
            manual processes.
          </p>

          <p className="mt-4 text-zinc-400 leading-relaxed">
            TeamOS brings everything together into a single platform designed
            for real-world property operations.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-semibold text-center mb-16">
            Everything you need to run property operations
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-600 transition">
              <Building2 className="text-blue-500 mb-4" size={28} />
              <h3 className="font-semibold text-lg">Property Management</h3>
              <p className="text-sm text-zinc-400 mt-2">
                Manage properties, units and tenants in one organized system.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-600 transition">
              <Wrench className="text-blue-500 mb-4" size={28} />
              <h3 className="font-semibold text-lg">Service Operations</h3>
              <p className="text-sm text-zinc-400 mt-2">
                Track cleaning jobs, maintenance tasks and before / after
                photos.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-600 transition">
              <Users className="text-blue-500 mb-4" size={28} />
              <h3 className="font-semibold text-lg">Team Management</h3>
              <p className="text-sm text-zinc-400 mt-2">
                Assign jobs, manage permissions and monitor team activity.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-600 transition">
              <BarChart3 className="text-blue-500 mb-4" size={28} />
              <h3 className="font-semibold text-lg">Business Tools</h3>
              <p className="text-sm text-zinc-400 mt-2">
                Generate invoices, analyze reports and track operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-zinc-950 py-28 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold text-center mb-16">
            How TeamOS works
          </h2>

          <div className="grid md:grid-cols-3 gap-10 text-center">
            <div>
              <Layers className="mx-auto text-blue-500 mb-4" size={32} />
              <h3 className="font-semibold text-lg">Add Properties</h3>
              <p className="text-zinc-400 text-sm mt-2">
                Register properties and organize units in one centralized
                system.
              </p>
            </div>

            <div>
              <Users className="mx-auto text-blue-500 mb-4" size={32} />
              <h3 className="font-semibold text-lg">Assign Teams</h3>
              <p className="text-zinc-400 text-sm mt-2">
                Assign cleaning teams and maintenance staff to properties and
                tasks.
              </p>
            </div>

            <div>
              <CheckCircle className="mx-auto text-blue-500 mb-4" size={32} />
              <h3 className="font-semibold text-lg">Track Operations</h3>
              <p className="text-zinc-400 text-sm mt-2">
                Monitor jobs, reports and invoices from one unified dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold">Get early access</h2>

          <p className="mt-6 text-zinc-400">
            We are onboarding a limited number of property managers and service
            companies to test TeamOS.
          </p>

          <div className="mt-10">
            <Button
              size="lg"
              className="px-10 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
              onClick={() => router.push("/early-access")}
            >
              Join Early Access
            </Button>
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            Pricing and public launch coming soon.
          </p>
        </div>
      </section>
    </main>
  );
}
