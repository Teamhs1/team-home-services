import { getAuth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function DELETE(req, { params }) {
  try {
    /* ---------- AUTH ---------- */
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (user?.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const companyId = params.id;

    /* ---------- CHECK RELATIONS ---------- */
    const { count: propsCount } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    const { count: usersCount } = await supabase
      .from("company_members")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    if ((propsCount ?? 0) > 0 || (usersCount ?? 0) > 1) {
      return NextResponse.json(
        { error: "Company has users or properties assigned" },
        { status: 400 },
      );
    }

    /* ---------- DELETE ---------- */
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", companyId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE COMPANY ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 },
    );
  }
}
