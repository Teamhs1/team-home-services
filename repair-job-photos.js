import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.script" });

// =====================================================
// 🔐 Validar variables
// =====================================================
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ ERROR: No SUPABASE_URL o SERVICE_ROLE_KEY en .env.script");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================================
// 🔧 Utilidad: Crear carpeta de backups si no existe
// =====================================================
if (!fs.existsSync("backups")) fs.mkdirSync("backups");

const mode = process.argv[2] || "scan"; // scan | repair

// =====================================================
// 🔧 Función principal
// =====================================================
async function repairPhotos() {
  console.log("=======================================================");
  console.log(`🔧 REPARADOR DE FOTOS — Modo: ${mode.toUpperCase()}`);
  console.log("=======================================================\n");

  // 1) Leer las fotos de la BD
  const { data: photos, error } = await supabase.from("job_photos").select("*");

  if (error) {
    console.error("❌ Error cargando job_photos:", error.message);
    return;
  }

  console.log(`📸 Total fotos encontradas en BD: ${photos.length}\n`);

  let broken = [];
  let fixed = [];

  for (const photo of photos) {
    const { id, job_id, image_url } = photo;

    // 1️⃣ Saltar las URLs ya buenas
    if (image_url.startsWith("http")) continue;

    const fileName = image_url.split("/").pop();

    // Buscar en el bucket donde está realmente el archivo
    const { data: folders } = await supabase.storage
      .from("job-photos")
      .list(job_id, { limit: 200 });

    if (!folders) continue;

    let foundPath = null;

    for (const f of folders) {
      const folderPath = `${job_id}/${f.name}`;
      const { data: nested } = await supabase.storage
        .from("job-photos")
        .list(folderPath, { limit: 200 });

      if (!nested) continue;

      const match = nested.find((n) => n.name === fileName);
      if (match) {
        foundPath = `${folderPath}/${match.name}`;
        break;
      }
    }

    if (!foundPath) {
      broken.push({
        id,
        image_url,
        problem: "Archivo no existe en bucket",
      });
      continue;
    }

    fixed.push({
      id,
      old: image_url,
      new: foundPath,
    });
  }

  // =====================================================
  // MODO SCAN → NO CAMBIA NADA
  // =====================================================
  if (mode === "scan") {
    console.log("🔍 MODO SCAN — No se cambia nada.\n");

    console.log("📌 Fotos con problemas:");
    console.table(broken);

    console.log("\n📌 Fotos con ruta reparable:");
    console.table(fixed);

    const summary = {
      timestamp: new Date().toISOString(),
      totalPhotos: photos.length,
      brokenCount: broken.length,
      fixableCount: fixed.length,
      broken,
      fixed,
    };

    fs.writeFileSync(
      `backups/scan-report-${Date.now()}.json`,
      JSON.stringify(summary, null, 2)
    );

    console.log("\n📄 Archivo generado: backups/scan-report-*.json");
    return;
  }

  // =====================================================
  // MODO REPAIR → CAMBIA LA BASE DE DATOS
  // =====================================================

  console.log("🛠 MODO REPAIR — Se actualizará job_photos\n");

  // Backup antes de modificar nada
  fs.writeFileSync(
    `backups/job_photos-backup-${Date.now()}.json`,
    JSON.stringify(photos, null, 2)
  );

  console.log("📄 Backup creado en carpeta backups/\n");

  let updated = 0;

  for (const fix of fixed) {
    const { error: upError } = await supabase
      .from("job_photos")
      .update({ image_url: fix.new })
      .eq("id", fix.id);

    if (!upError) {
      updated++;
      console.log(`🔧 Reparado → ID ${fix.id}`);
    } else {
      console.log(`⚠️ Error actualizando ID ${fix.id}: ${upError.message}`);
    }
  }

  console.log("\n===============================");
  console.log(`✨ Reparación completada`);
  console.log(`Total reparadas: ${updated}`);
  console.log(`Total rotas sin arreglo: ${broken.length}`);
  console.log("===============================\n");

  fs.writeFileSync(
    `backups/repair-report-${Date.now()}.json`,
    JSON.stringify(
      {
        fixed,
        broken,
        updated,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log("📄 Archivo de reporte guardado en backups/");
}

// Ejecutar
repairPhotos();
