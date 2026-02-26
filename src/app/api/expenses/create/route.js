import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";
import { checkBillingForCompany } from "@/lib/server/checkBilling";

export async function POST(req) {
  try {
    /* =====================================================
       🔐 AUTH
    ===================================================== */
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* =====================================================
       📦 FORM DATA
    ===================================================== */
    const formData = await req.formData();

    const amount = Number(formData.get("amount"));
    const description = formData.get("description");
    const property_id = formData.get("property_id");
    const unit_id = formData.get("unit_id");
    const file = formData.get("file");
    const tax = Number(formData.get("tax"));
    const final_cost = Number(formData.get("final_cost"));

    /* =====================================================
       ✅ VALIDATION
    ===================================================== */
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

    /* =====================================================
       🔑 SUPABASE SERVICE ROLE
    ===================================================== */
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    /* =====================================================
       🔎 GET PROFILE
    ===================================================== */
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

    /* =====================================================
       🔥 GET REAL COMPANY FROM PROPERTY
    ===================================================== */
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("company_id")
      .eq("id", property_id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: "Invalid property" }, { status: 400 });
    }

    /* =====================================================
       🔒 BILLING CHECK (CENTRALIZED)
    ===================================================== */
    const billingCheck = await checkBillingForCompany(
      supabase,
      property.company_id,
    );

    if (!billingCheck.ok) {
      return NextResponse.json(
        { error: billingCheck.error },
        { status: billingCheck.status },
      );
    }

    /* =====================================================
       💾 INSERT EXPENSE
    ===================================================== */
    const { data: expense, error: insertError } = await supabase
      .from("expenses")
      .insert({
        contractor_id: profile.id,
        contractor_name: profile.full_name,
        property_id,
        unit_id,
        description,
        amount,
        tax,
        final_cost,
        expense_date: new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    /* =====================================================
       📂 UPLOAD FILE
    ===================================================== */
    const ext = file.name.split(".").pop();
    const path = `expenses/${profile.id}/${expense.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("expense-invoices")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    /* =====================================================
       🔄 UPDATE FILE URL
    ===================================================== */
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
