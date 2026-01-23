// src/app/api/admin/features/route.js
import { NextResponse } from "next/server";

/* =========================
   GET /api/admin/features
========================= */
export async function GET() {
  try {
    const mockData = {
      id: 1,
      name: "Example",
      features: [],
    };

    return NextResponse.json({
      message: "Features fetched",
      data: mockData,
    });
  } catch (error) {
    console.error("❌ Error in features route:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
