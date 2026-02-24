// /api/admin/rentals/route.js

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
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

    let query = supabase.from("units").select(
      `
        id,
        unit,
        rent_price,
        available_from,
        availability_status,
        is_for_rent,
        property:properties (
          id,
          address,
          company_id
        )
      `,
    );

    /* =========================
       👑 SUPER ADMIN
    ========================= */

    if (permissions.isSuperAdmin) {
      if (companyIdParam) {
        query = query.eq("properties.company_id", companyIdParam);
      }
    } else {
      /* =========================
       🔐 OTROS ROLES
    ========================= */
      query = query.in("properties.company_id", permissions.allowedCompanyIds);

      if (companyIdParam) {
        if (!permissions.allowedCompanyIds.includes(companyIdParam)) {
          return NextResponse.json(
            { error: "Not authorized for this company" },
            { status: 403 },
          );
        }

        query = query.eq("properties.company_id", companyIdParam);
      }
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 },
    );
  }
}
