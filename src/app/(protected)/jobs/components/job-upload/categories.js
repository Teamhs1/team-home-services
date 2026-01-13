// components/job-upload/categories.js
import {
  Flame,
  ChefHat,
  IceCream,
  Snowflake,
  Toilet,
  Bath,
  Droplet,
  UtensilsCrossed,
  Refrigerator,
  ShowerHead,
  BedSingle,
  Armchair,
  Wind,
  PanelTop, // ✅ Nuevo icono agregado
} from "lucide-react";

// ================================
// COMPARE CATEGORIES (fijas)
// ================================
export const staticCompare = [
  { key: "stove", label: "Stove", icon: Flame },
  { key: "stove_back", label: "Behind Stove", icon: ChefHat },
  { key: "fridge", label: "Fridge", icon: IceCream },
  { key: "fridge_back", label: "Behind Fridge", icon: Snowflake },
  { key: "toilet", label: "Toilet", icon: Toilet },
  { key: "bathtub", label: "Bathtub", icon: Bath },
  { key: "sink", label: "Sink", icon: Droplet },
];

// ================================
// DYNAMIC COMPARE by FEATURES
// ================================
export function compareFromFeatures(features) {
  const output = [];

  // Dishwasher
  if (features.includes("dishwasher")) {
    output.push({
      key: "dishwasher",
      label: "Dishwasher",
      icon: Refrigerator,
    });
  }

  // ================================
  // MICROWAVE — real icon (PanelTop)
  // ================================
  if (features.includes("microwave")) {
    output.push({
      key: "microwave",
      label: "Microwave",
      icon: PanelTop, // ✅ icono más parecido a un microondas
    });

    output.push({
      key: "microwave_inside",
      label: "Inside Microwave",
      icon: Droplet,
    });
  }

  // Freezer
  if (features.includes("freezer")) {
    output.push({
      key: "freezer",
      label: "Freezer",
      icon: Refrigerator,
    });

    output.push({
      key: "freezer_inside",
      label: "Inside Freezer",
      icon: Snowflake,
    });
  }

  // A/C Unit
  if (features.includes("air_conditioner") || features.includes("laundry")) {
    output.push({
      key: "ac_unit",
      label: "A/C Unit",
      icon: Wind,
    });
  }

  return output;
}

// ================================
// GENERAL AREAS
// ================================
export function generalAreas(features, type, unitType) {
  const base = [
    { key: "kitchen", label: "Kitchen", icon: UtensilsCrossed },
    { key: "bathroom", label: "Bathroom", icon: ShowerHead },
    { key: "living_room", label: "Living Room", icon: Armchair },
  ];

  if (features.includes("laundry")) {
    base.push({
      key: "laundry_unit",
      label: "Washer / Dryer",
      icon: Droplet,
    });
  }

  if (features.includes("balcony")) {
    base.push({
      key: "balcony_area",
      label: "Balcony",
      icon: Armchair,
    });
  }

  if (features.includes("glass_shower")) {
    base.push({
      key: "glass_shower_area",
      label: "Glass Shower",
      icon: ShowerHead,
    });
  }

  if (features.includes("double_sink")) {
    base.push({
      key: "double_sink_area",
      label: "Double Sink",
      icon: Droplet,
    });
  }

  if (
    type === "after" &&
    unitType &&
    ["1_bed", "2_beds", "3_beds", "4_beds"].includes(unitType)
  ) {
    const count = parseInt(unitType); // "1_bed" -> 1

    for (let i = 1; i <= count; i++) {
      base.push({
        key: `bedroom_${i}`,
        label: `Bedroom ${i}`,
        icon: BedSingle,
      });
    }
  }

  return base;
}
