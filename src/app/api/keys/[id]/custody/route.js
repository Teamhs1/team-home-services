import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req, { params }) {
  try {
    /* =========================
       AUTH
    ========================= */
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keyId = params.id;
    if (!keyId) {
      return NextResponse.json({ error: "Missing key id" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    /* =========================
       LOAD PROFILE / COMPANY
    ========================= */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("active_company_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile?.active_company_id) {
      return NextResponse.json({ error: "No active company" }, { status: 403 });
    }

    const companyId = profile.active_company_id;

    /* =========================
       VALIDATE KEY OWNERSHIP
    ========================= */
    const { data: key } = await supabase
      .from("keys")
      .select("id")
      .eq("id", keyId)
      .single();

    if (!key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    /* =========================
       CURRENT CUSTODY
    ========================= */
    const { data: current } = await supabase
      .from("key_custody")
      .select("*")
      .eq("key_id", keyId)
      .eq("company_id", companyId)
      .is("returned_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    /* =========================
       HISTORY
    ========================= */
    const { data: history, error: historyError } = await supabase
      .from("key_custody")
      .select("*")
      .eq("key_id", keyId)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (historyError) {
      return NextResponse.json(
        { error: "Failed to load custody history" },
        { status: 500 }
      );
    }

    /* =========================
       DONE
    ========================= */
    return NextResponse.json({
      current: current || null,
      history: history || [],
    });
  } catch (err) {
    console.error("Custody GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
