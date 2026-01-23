import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export async function DELETE(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { expenseId } = await req.json();

    if (!expenseId) {
      return NextResponse.json({ error: "Missing expenseId" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    /* =========================
       LOAD PROFILE
    ========================= */
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    /* =========================
       LOAD EXPENSE
    ========================= */
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .select(
        `
        id,
        contractor_id,
        invoice_url,
        contractor:profiles (
          company_id
        )
      `,
      )
      .eq("id", expenseId)
      .single();

    if (expenseError || !expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    /* =========================
       PERMISSIONS
    ========================= */
    const isAdmin = profile.role === "admin";
    const isStaffOwner = expense.contractor_id === profile.id;
    const isClientOwner =
      profile.role === "client" &&
      expense.contractor?.company_id === profile.company_id;

    if (!isAdmin && !isStaffOwner && !isClientOwner) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    /* =========================
       DELETE FILE (IF EXISTS)
    ========================= */
    if (expense.invoice_url) {
      await supabase.storage
        .from("expense-invoices")
        .remove([expense.invoice_url]);
    }

    /* =========================
       DELETE EXPENSE
    ========================= */
    const { error: deleteError } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete expense" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE EXPENSE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
