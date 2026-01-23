console.log("🔥 EXPENSE CREATE ROUTE LOADED");

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    /* =====================
       NORMALIZE NUMBERS
    ===================== */
    const amount = Number(formData.get("amount")) || 0;
    const tax = Number(formData.get("tax")) || 0;
    const final_cost =
      Number(formData.get("final_cost")) || amount + amount * 0.15;

    const description = formData.get("description");
    const property_id = formData.get("property_id");
    const unit_id = formData.get("unit_id");
    const contractor_id = formData.get("contractor_id");
    const file = formData.get("file");

    /* =====================
       VALIDATION
    ===================== */
    if (
      Number.isNaN(amount) ||
      amount <= 0 ||
      !description ||
      !property_id ||
      !unit_id ||
      !contractor_id ||
      !file
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type", details: file.type },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    /* =====================
       CREATOR PROFILE
    ===================== */
    const { data: creator } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("clerk_id", userId)
      .single();

    if (!creator || !["admin", "client"].includes(creator.role)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    /* =====================
       CONTRACTOR PROFILE
    ===================== */
    const { data: contractor } = await supabase
      .from("profiles")
      .select("id, full_name, role, company_id")
      .eq("id", contractor_id)
      .single();
    console.log("🧪 VALIDATION CHECK", {
      creatorCompany: creator.company_id,
      contractorCompany: contractor.company_id,
    });

    if (!contractor || contractor.role !== "staff") {
      return NextResponse.json(
        { error: "Invalid contractor" },
        { status: 400 },
      );
    }

    // 🔑 DIFERENCIA CLAVE
    if (creator.role === "client") {
      const { data: membership } = await supabase
        .from("company_members")
        .select("id")
        .eq("company_id", creator.company_id)
        .eq("profile_id", contractor.id)
        .eq("role", "staff")
        .maybeSingle();

      if (!membership) {
        return NextResponse.json(
          { error: "Contractor does not belong to your company" },
          { status: 403 },
        );
      }
    }

    /* =====================
       INSERT EXPENSE
    ===================== */
    const { data: expense, error: insertError } = await supabase
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

    if (insertError) {
      console.error("INSERT ERROR:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    /* =====================
       UPLOAD INVOICE
    ===================== */
    const ext = file.name.split(".").pop();
    const path = `expenses/${contractor.id}/${expense.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("expense-invoices")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("UPLOAD ERROR:", uploadError);
      return NextResponse.json(
        {
          error: "Invoice upload failed",
          details: uploadError.message,
        },
        { status: 500 },
      );
    }

    /* =====================
       UPDATE EXPENSE
    ===================== */
    const { error: updateError } = await supabase
      .from("expenses")
      .update({ invoice_url: path })
      .eq("id", expense.id);

    if (updateError) {
      console.error("UPDATE ERROR:", updateError);
    }

    return NextResponse.json({
      success: true,
      expense_id: expense.id,
    });
  } catch (err) {
    console.error("ADMIN EXPENSE CREATE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
