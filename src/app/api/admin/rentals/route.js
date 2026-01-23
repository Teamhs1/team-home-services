import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET() {
  const { sessionClaims } = auth();
  const role = sessionClaims?.publicMetadata?.role;

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase.from("units").select(
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ units: data || [] });
}
