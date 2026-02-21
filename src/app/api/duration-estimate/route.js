export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const body = await req.json();

    let { service_type, bedrooms, bathrooms, unit_type, floors } = body;

    if (!service_type) {
      return NextResponse.json(
        { error: "Missing service_type" },
        { status: 400 },
      );
    }

    // 🔥 NORMALIZACIÓN
    service_type = service_type
      ?.toString()
      .trim()
      .toLowerCase()
      .replaceAll(" ", "_");

    unit_type = unit_type?.toString().trim().toLowerCase();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const isHallway = service_type.includes("hallway");

    console.log("SERVICE:", service_type);
    console.log("UNIT:", unit_type);
    console.log("BEDROOMS:", bedrooms);
    console.log("BATHROOMS:", bathrooms);
    console.log("FLOORS:", floors);

    /* ===============================
   🏢 HALLWAY (Dinámico)
================================ */
    if (isHallway) {
      floors = Number(floors);

      if (!floors || floors < 1) {
        return NextResponse.json({
          hours: null,
          match_type: "missing_hallway_fields",
        });
      }

      // 🔥 1 level = 2h
      // 🔥 Cada nivel extra = +1h
      const baseHours = 2;
      const extraLevels = Math.max(0, floors - 1);
      const totalHours = baseHours + extraLevels;

      return NextResponse.json({
        hours: totalHours,
      });
    }

    /* ===============================
   🏠 NORMAL CLEANING
================================ */

    if (!unit_type) {
      return NextResponse.json({ error: "Missing unit_type" }, { status: 400 });
    }

    bedrooms = Number(bedrooms);
    bathrooms = Number(bathrooms);

    // 🔥 Buscar base solo por bedrooms
    const { data: baseData, error } = await supabase
      .from("service_duration_rules")
      .select("estimated_hours")
      .eq("service_type", service_type)
      .eq("unit_type", unit_type)
      .eq("bedrooms", bedrooms)
      .limit(1);

    if (error) console.log("BASE ERROR:", error);

    let baseHours = baseData?.[0]?.estimated_hours;

    if (!baseHours) {
      return NextResponse.json({ hours: null });
    }

    baseHours = Number(baseHours);

    // 🔥 Lógica dinámica para Deep Cleaning
    if (service_type === "deep_cleaning") {
      const extraBathrooms = Math.max(0, bathrooms - 1);
      const extraHours = extraBathrooms * 2; // +2h por baño extra
      baseHours += extraHours;
    }

    return NextResponse.json({
      hours: baseHours,
    });
  } catch (err) {
    console.error("DURATION ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
