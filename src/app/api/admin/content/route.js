import { getAuth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// 🔐 Supabase service role (SERVER ONLY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    /* =========================
       AUTH CHECK (FIX REAL)
    ========================= */
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: not signed in" },
        { status: 401 }
      );
    }

    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: user not found" },
        { status: 401 }
      );
    }

    const role = user.publicMetadata?.role;

    if (role !== "admin") {
      return NextResponse.json(
        { error: "Access denied: admin only" },
        { status: 403 }
      );
    }

    /* =========================
       BODY
    ========================= */
    const { about, services, serviceDetails } = await req.json();

    const updates = [];

    if (about) {
      updates.push(
        supabase
          .from("site_content")
          .update({ content: about })
          .eq("section", "about")
      );
    }

    if (services) {
      updates.push(
        supabase
          .from("site_content")
          .update({ content: { items: services } })
          .eq("section", "services")
      );
    }

    if (serviceDetails) {
      updates.push(
        supabase
          .from("site_content")
          .update({ content: { items: serviceDetails } })
          .eq("section", "service_details")
      );
    }

    const results = await Promise.all(updates);
    const errors = results.map((r) => r.error).filter(Boolean);
    if (errors.length) throw errors[0];

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ /api/admin/content error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
