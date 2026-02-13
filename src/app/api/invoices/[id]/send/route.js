// src/app/api/invoices/[id]/send/route.js
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // validar rol
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (!profile || !["admin", "staff"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    // validar invoice
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, status, deleted_at")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status !== "draft") {
      return NextResponse.json(
        { error: "Invoice cannot be sent in its current status" },
        { status: 400 },
      );
    }

    // 🔥 SOLO CAMBIAMOS STATUS
    const { data: updated, error } = await supabase
      .from("invoices")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ invoice: updated });
  } catch (err) {
    console.error("❌ Send invoice error:", err);

    return NextResponse.json(
      { error: "Failed to send invoice" },
      { status: 500 },
    );
  }
}
