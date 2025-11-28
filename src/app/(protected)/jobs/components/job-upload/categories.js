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
} from "lucide-react";

export const staticCompare = [
  { key: "stove", label: "Stove", icon: Flame },
  { key: "stove_back", label: "Behind Stove", icon: ChefHat },
  { key: "fridge", label: "Fridge", icon: IceCream },
  { key: "fridge_back", label: "Behind Fridge", icon: Snowflake },
  { key: "toilet", label: "Toilet", icon: Toilet },
  { key: "bathtub", label: "Bathtub", icon: Bath },
  { key: "sink", label: "Sink", icon: Droplet },
];

// Features que agregan categorías a Compare
export function compareFromFeatures(features) {
  const output = [];

  if (features.includes("dishwasher")) {
    output.push({
      key: "dishwasher",
      label: "Dishwasher",
      icon: UtensilsCrossed,
    });
  }

  if (features.includes("air_conditioner") || features.includes("laundry")) {
    output.push({
      key: "ac_unit",
      label: "A/C Unit",
      icon: Wind,
    });
  }

  return output;
}

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

  if (features.includes("microwave")) {
    base.push({
      key: "microwave_unit",
      label: "Microwave",
      icon: UtensilsCrossed,
    });
  }

  if (features.includes("freezer")) {
    base.push({
      key: "freezer_unit",
      label: "Freezer",
      icon: Refrigerator,
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

  // Bedrooms dinámicos
  if (
    type === "after" &&
    unitType &&
    ["1 Bed", "2 Beds", "3 Beds", "4 Beds"].includes(unitType)
  ) {
    const count = parseInt(unitType);
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
