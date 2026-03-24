import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ==========================
// HELPER → BUILDIUM FETCH
// ==========================
async function fetchBuildium(endpoint, clientId, clientSecret) {
  const res = await fetch(`https://api.buildium.com/v1/${endpoint}`, {
    headers: {
      "x-buildium-client-id": clientId,
      "x-buildium-client-secret": clientSecret,
    },
  });

  if (!res.ok) {
    throw new Error(`Buildium error: ${res.status}`);
  }

  return res.json();
}

// ==========================
// TRANSFORM HELPERS
// ==========================
function mapProperty(p, companyId) {
  return {
    name: p.Name || "Property",
    address: p.Address?.AddressLine1 || "",
    city: p.Address?.City || "",
    state: p.Address?.State || "",
    zip: p.Address?.PostalCode || "",
    country: p.Address?.Country || "CA",
    company_id: companyId,
  };
}

function mapUnit(u, propertyMap, companyId) {
  return {
    unit: u.UnitNumber || "Unit",
    property_id: propertyMap[u.PropertyId],
    company_id: companyId,
  };
}

// ==========================
// MAIN ENDPOINT
// ==========================
export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId, clientSecret } = await req.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Missing Buildium credentials" },
        { status: 400 },
      );
    }

    // 🔹 Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("clerk_id", userId)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: "No company assigned" },
        { status: 400 },
      );
    }

    const companyId = profile.company_id;

    // ==========================
    // 1. FETCH BUILDIUM DATA
    // ==========================
    const properties = await fetchBuildium("rentals", clientId, clientSecret);
    const units = await fetchBuildium("rentals/units", clientId, clientSecret);

    // ==========================
    // 2. INSERT PROPERTIES
    // ==========================
    const mappedProperties = properties.map((p) => mapProperty(p, companyId));

    const { data: insertedProperties, error: propError } = await supabase
      .from("properties")
      .insert(mappedProperties)
      .select();

    if (propError) {
      throw new Error(propError.message);
    }

    // ==========================
    // 3. CREATE PROPERTY MAP
    // ==========================
    const propertyMap = {};
    properties.forEach((p, index) => {
      propertyMap[p.Id] = insertedProperties[index].id;
    });

    // ==========================
    // 4. INSERT UNITS
    // ==========================
    const mappedUnits = units
      .filter((u) => propertyMap[u.PropertyId])
      .map((u) => mapUnit(u, propertyMap, companyId));

    const { error: unitError } = await supabase
      .from("units")
      .insert(mappedUnits);

    if (unitError) {
      throw new Error(unitError.message);
    }

    // ==========================
    // SUCCESS
    // ==========================
    return NextResponse.json({
      success: true,
      propertiesImported: mappedProperties.length,
      unitsImported: mappedUnits.length,
    });
  } catch (err) {
    console.error("IMPORT ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Import failed" },
      { status: 500 },
    );
  }
}
