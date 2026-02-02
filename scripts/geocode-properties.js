// scripts/geocode-properties.js
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const fetch = require("node-fetch"); // ✅ ahora sí funciona

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!supabaseUrl || !serviceKey || !googleKey) {
  console.error("❌ Missing env vars", {
    supabaseUrl,
    serviceKey: !!serviceKey,
    googleKey: !!googleKey,
  });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function geocode(address) {
  const fullAddress = `${address}, Moncton NB, Canada`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    fullAddress,
  )}&key=${googleKey}`;

  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== "OK") {
    console.warn(`⚠️ Geocode failed: ${address}`, json.status);
    return null;
  }

  return json.results[0].geometry.location;
}

(async () => {
  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, address")
    .is("lat", null)
    .is("lng", null);

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log(`📍 Geocoding ${properties.length} properties\n`);

  for (const p of properties) {
    if (!p.address) continue;

    const coords = await geocode(p.address);
    if (!coords) continue;

    await supabase
      .from("properties")
      .update({
        lat: coords.lat,
        lng: coords.lng,
      })
      .eq("id", p.id);

    console.log(`✅ ${p.address} → ${coords.lat}, ${coords.lng}`);

    // evitar rate limit
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log("\n🎉 Done");
})();
