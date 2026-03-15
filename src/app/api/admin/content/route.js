import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    /* =========================
       AUTH
    ========================= */
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* =========================
       ROLE FROM SUPABASE
    ========================= */
    const { data: currentUser } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (!currentUser || currentUser.role !== "super_admin") {
      return NextResponse.json(
        { error: "Access denied: super admin only" },
        { status: 403 },
      );
    }

    /* =========================
       BODY
    ========================= */
    const {
      about,
      services,
      serviceDetails,
      softwareHero,
      softwareProblem,
      softwareFeatures,
      softwareSteps,
      softwareCTA,
    } = await req.json();

    const updates = [];

    /* ABOUT */
    if (about) {
      updates.push(
        supabase
          .from("site_content")
          .update({ content: about })
          .eq("section", "about"),
      );
    }

    /* SERVICES */
    if (services) {
      updates.push(
        supabase
          .from("site_content")
          .update({ content: { items: services } })
          .eq("section", "services"),
      );
    }

    /* SERVICE DETAILS */
    if (serviceDetails) {
      updates.push(
        supabase
          .from("site_content")
          .update({ content: { items: serviceDetails } })
          .eq("section", "service_details"),
      );
    }

    /* SOFTWARE HERO */
    if (softwareHero) {
      updates.push(
        supabase
          .from("site_content")
          .update({ content: softwareHero })
          .eq("section", "software_hero"),
      );
    }

    /* SOFTWARE PROBLEM */
    if (softwareProblem) {
      updates.push(
        supabase
          .from("site_content")
          .update({ content: softwareProblem })
          .eq("section", "software_problem"),
      );
    }

    /* SOFTWARE FEATURES */
    if (softwareFeatures) {
      updates.push(
        supabase
          .from("site_content")
          .update({ content: softwareFeatures })
          .eq("section", "software_features"),
      );
    }

    /* SOFTWARE STEPS */
    if (softwareSteps) {
      updates.push(
        supabase
          .from("site_content")
          .update({ content: softwareSteps })
          .eq("section", "software_steps"),
      );
    }

    /* SOFTWARE CTA */
    if (softwareCTA) {
      updates.push(
        supabase
          .from("site_content")
          .update({ content: softwareCTA })
          .eq("section", "software_cta"),
      );
    }

    /* =========================
       EXECUTE
    ========================= */
    const results = await Promise.all(updates);

    const errors = results.map((r) => r.error).filter(Boolean);

    if (errors.length) throw errors[0];

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ /api/admin/content error:", err);

    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
