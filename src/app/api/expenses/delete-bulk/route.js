import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No expense ids provided" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 🔎 Validar rol
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("clerk_id", userId)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    // 📎 Obtener invoices para borrarlos del storage
    const { data: expenses } = await supabase
      .from("expenses")
      .select("invoice_url")
      .in("id", ids);

    const filesToDelete = (expenses || [])
      .map((e) => e.invoice_url)
      .filter(Boolean);

    if (filesToDelete.length > 0) {
      await supabase.storage.from("expense-invoices").remove(filesToDelete);
    }

    // 🗑️ Borrar expenses
    const { error } = await supabase.from("expenses").delete().in("id", ids);

    if (error) {
      console.error("BULK DELETE EXPENSE ERROR:", error);
      return NextResponse.json(
        { error: "Failed to delete expenses" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: ids.length,
    });
  } catch (err) {
    console.error("DELETE BULK EXPENSES ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
