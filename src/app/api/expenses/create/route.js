import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    // 🔐 Clerk auth SIN middleware
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const amount = Number(formData.get("amount"));
    const description = formData.get("description");
    const property_id = formData.get("property_id");
    const unit_id = formData.get("unit_id");
    const file = formData.get("file");
    const tax = Number(formData.get("tax"));
    const final_cost = Number(formData.get("final_cost"));

    console.log("EXPENSE CREATE INPUT:", {
      amount,
      description,
      property_id,
      unit_id,
      fileName: file?.name,
      fileType: file?.type,
    });

    // ✅ Validación extendida (NO rompe nada)
    if (
      Number.isNaN(amount) ||
      amount <= 0 ||
      Number.isNaN(tax) ||
      Number.isNaN(final_cost) ||
      !description ||
      !property_id ||
      !unit_id ||
      !file
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 },
      );
    }

    // 🔑 Supabase SERVICE ROLE
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 🔎 Obtener profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, full_name")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    const allowedRoles = ["staff", "admin", "super_admin"];

    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    // 1️⃣ Insert expense (unit_id agregado)
    const { data: expense, error: insertError } = await supabase
      .from("expenses")
      .insert({
        contractor_id: profile.id,
        contractor_name: profile.full_name,
        property_id,
        unit_id, // ✅ FALTABA
        description,
        amount,
        tax, // ✅ FALTABA
        final_cost, // ✅ FALTABA
        expense_date: new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (insertError) {
      console.error("INSERT EXPENSE ERROR:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // 2️⃣ Upload invoice
    const ext = file.name.split(".").pop();
    const path = `expenses/${profile.id}/${expense.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("expense-invoices")
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 3️⃣ Update invoice_url
    await supabase
      .from("expenses")
      .update({ invoice_url: path })
      .eq("id", expense.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("EXPENSE API ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
