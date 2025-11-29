import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // necesita service role para UPDATE masivo
      {
        auth: { persistSession: false },
      }
    );

    const sqlCommands = `
      -- 1. Fix BEFORE
      UPDATE job_photos
      SET category = 'before',
          type = 'before'
      WHERE image_url ILIKE '%/before/%'
         OR image_url ILIKE '%before_%';

      -- 2. Fix AFTER
      UPDATE job_photos
      SET category = 'after',
          type = 'after'
      WHERE image_url ILIKE '%/after/%'
         OR image_url ILIKE '%after_%';

      -- 3. General areas -> always AFTER
      UPDATE job_photos
      SET type = 'after'
      WHERE category IN ('kitchen', 'bathroom', 'bedroom', 'living_room');

      -- 4. Null / empty / general → normalize to AFTER
      UPDATE job_photos
      SET category = 'after',
          type = 'after'
      WHERE (category IS NULL OR category = '' OR category = 'general')
        AND NOT (image_url ILIKE '%/before/%' OR image_url ILIKE '%before_%');

      -- 5. Remove final leftovers
      UPDATE job_photos
      SET category = 'after'
      WHERE category = 'general';
    `;

    // Ejecutar todo en un RPC (Supabase lo permite con service role)
    const { error } = await supabase.rpc("exec_sql", { sql: sqlCommands });

    if (error) {
      console.error("Error executing SQL:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: "success",
      message: "Photos cleaned and normalized successfully.",
    });
  } catch (err) {
    console.error("🔥 Error fixing photos:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fix photos" },
      { status: 500 }
    );
  }
}
