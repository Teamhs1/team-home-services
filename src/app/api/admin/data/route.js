import { NextResponse } from "next/server";

export async function GET() {
  try {
    const mockData = { id: 1, name: "Example" };

    return NextResponse.json({
      message: "Data fetched",
      data: mockData,
    });
  } catch (error) {
    console.error("Error in /api/data:", error);

    return NextResponse.json(
      {
        message: "Internal Server Error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
