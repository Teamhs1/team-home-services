import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 🔑 PON TUS CREDENCIALES AQUÍ
    const clientId = "TU_CLIENT_ID";
    const clientSecret = "TU_CLIENT_SECRET";

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch("https://api.buildium.com/v1/rentals", {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    const text = await res.text();

    // 🔍 LOG PARA DEBUG
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text);

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "Buildium request failed",
          status: res.status,
          details: text,
        },
        { status: 500 },
      );
    }

    const data = JSON.parse(text);

    return NextResponse.json({
      success: true,
      count: data.length,
      sample: data[0] || null,
    });
  } catch (err) {
    console.error("ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 },
    );
  }
}
