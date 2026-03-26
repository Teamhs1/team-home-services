import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST() {
  try {
    const today = new Date();

    // 🔹 1. Obtener leases activos
    const { data: leases, error } = await supabase
      .from("leases")
      .select("*")
      .eq("status", "active");

    if (error) throw error;

    for (const lease of leases) {
      const dueDate = new Date(today.getFullYear(), today.getMonth(), 1);

      // 🔒 evitar duplicados
      const { data: existing } = await supabase
        .from("rent_payments")
        .select("id")
        .eq("lease_id", lease.id)
        .eq("due_date", dueDate.toISOString().split("T")[0])
        .maybeSingle();

      if (existing) continue;

      // 🔥 crear payment
      await supabase.from("rent_payments").insert({
        lease_id: lease.id,
        company_id: lease.company_id,
        amount: lease.rent_amount,
        due_date: dueDate,
        status: "pending",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("GENERATE PAYMENTS ERROR:", err.message);

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
