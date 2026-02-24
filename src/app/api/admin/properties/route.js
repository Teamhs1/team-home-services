import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { getAllowedCompanyIds } from "@/utils/permissions/getAllowedCompanyIds";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getAllowedCompanyIds(userId);

    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get("company_id");
    const clientIdParam = searchParams.get("client_id");

    let query = supabase
      .from("properties")
      .select(
        `
        id,
        name,
        address,
        unit,
        company_id,
        client_id,
        owner_id,
        owners:owner_id (
          id,
          full_name
        ),
        companies:company_id (
          id,
          name
        )
      `,
      )
      .eq("is_active", true)
      .order("address", { ascending: true })
      .order("name", { ascending: true });

    /* =========================
       👑 SUPER ADMIN
    ========================= */

    if (permissions.isSuperAdmin) {
      if (companyIdParam) {
        query = query.eq("company_id", companyIdParam);
      }
    } else {

    /* =========================
       🔐 TODOS LOS DEMÁS
    ========================= */
      query = query.in("company_id", permissions.allowedCompanyIds);

      if (companyIdParam) {
        if (!permissions.allowedCompanyIds.includes(companyIdParam)) {
          return NextResponse.json(
            { error: "Not authorized for this company" },
            { status: 403 },
          );
        }

        query = query.eq("company_id", companyIdParam);
      }
    }

    /* =========================
       🎯 CLIENT FILTER
    ========================= */

    if (clientIdParam) {
      query = query.eq("client_id", clientIdParam);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ⚠️ Mantenemos array directo para no romper frontend
    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 },
    );
  }
}
