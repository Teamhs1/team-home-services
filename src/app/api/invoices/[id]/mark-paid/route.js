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

    const { id } = params;

    // 🔍 validar perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // 🔍 obtener invoice válida (no borrada)
    const { data: existing, error: fetchError } = await supabase
      .from("invoices")
      .select("id, status, deleted_at")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (existing.status === "paid") {
      return NextResponse.json(
        { error: "Invoice already paid" },
        { status: 400 },
      );
    }

    // ✅ marcar como pagada
    const { data: invoice, error } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ invoice });
  } catch (err) {
    console.error("Mark paid error:", err);

    return NextResponse.json(
      { error: "Failed to mark invoice as paid" },
      { status: 500 },
    );
  }
}
