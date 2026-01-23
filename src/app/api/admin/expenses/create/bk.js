import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const amount = Number(formData.get("amount"));
    const tax = Number(formData.get("tax"));
    const final_cost = Number(formData.get("final_cost"));
    const description = formData.get("description");
    const property_id = formData.get("property_id");
    const unit_id = formData.get("unit_id");
    const contractor_id = formData.get("contractor_id");
    const file = formData.get("file");

    if (
      !amount ||
      !description ||
      !property_id ||
      !unit_id ||
      !contractor_id ||
      !file
    ) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 🔎 Creator profile
    const { data: creator } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (!creator || !["admin", "client"].includes(creator.role)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    // 🔎 Contractor profile
    const { data: contractor } = await supabase
      .from("profiles")
      .select("id, full_name, role, company_id")
      .eq("id", contractor_id)
      .single();

    if (
      !contractor ||
      contractor.role !== "staff" ||
      contractor.company_id !== creator.company_id
    ) {
      return NextResponse.json(
        { error: "Invalid contractor" },
        { status: 400 },
      );
    }

    // 1️⃣ Insert expense
    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        contractor_id: contractor.id,
        contractor_name: contractor.full_name,
        property_id,
        unit_id,
        description,
        amount,
        tax,
        final_cost,
        expense_date: new Date().toISOString().slice(0, 10),
        created_by: creator.id,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 2️⃣ Upload invoice
    const ext = file.name.split(".").pop();
    const path = `expenses/${contractor.id}/${expense.id}.${ext}`;

    await supabase.storage
      .from("expense-invoices")
      .upload(path, file, { upsert: true });

    await supabase
      .from("expenses")
      .update({ invoice_url: path })
      .eq("id", expense.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ADMIN EXPENSE CREATE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
