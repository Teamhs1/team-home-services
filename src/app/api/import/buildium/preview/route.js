import { NextResponse } from "next/server";

// ==========================
// FETCH BUILDIUM
// ==========================
async function fetchBuildium(endpoint, clientId, clientSecret) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`https://api.buildium.com/v1/${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Buildium error:", res.status, text);
    throw new Error(`Buildium error: ${res.status}`);
  }

  return res.json();
}

// ==========================
// PREVIEW ROUTE
// ==========================
export async function POST(req) {
  try {
    const { clientId, clientSecret } = await req.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 },
      );
    }

    // 🔹 Fetch minimal data
    const properties = await fetchBuildium("rentals", clientId, clientSecret);

    const units = await fetchBuildium("rentals/units", clientId, clientSecret);

    // ⚡ SOLO COUNT (rápido)
    return NextResponse.json({
      properties: properties.length,
      units: units.length,
      tenants: 0, // next step
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to preview data" },
      { status: 500 },
    );
  }
}
