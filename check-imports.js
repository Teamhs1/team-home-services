// check-imports.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Ruta base de tu proyecto
const SRC_DIR = path.join(__dirname, "src");

// 🔹 Patrón de alias que Next.js debe resolver
const ALIAS_PREFIX = "@/";

// 🔹 Recorrer archivos recursivamente
function getAllFiles(dir, ext = [".js", ".jsx"]) {
  let files = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(getAllFiles(full, ext));
    } else if (ext.includes(path.extname(full))) {
      files.push(full);
    }
  }
  return files;
}

// 🔹 Validar imports
function checkImports() {
  console.log("🔍 Checking imports...\n");
  const files = getAllFiles(SRC_DIR);
  let broken = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const matches = content.match(/from\s+["'](@\/[^"']+)["']/g);
    if (matches) {
      for (const match of matches) {
        const importPath = match.match(/["'](@\/[^"']+)["']/)[1];
        const relative = importPath.replace(ALIAS_PREFIX, "");
        const resolved = path.join(SRC_DIR, relative);

        // Intentar encontrar archivo
        const possibleFiles = [
          resolved,
          `${resolved}.js`,
          `${resolved}.jsx`,
          `${resolved}/index.js`,
          `${resolved}/index.jsx`,
        ];

        const exists = possibleFiles.some((f) => fs.existsSync(f));
        if (!exists) {
          broken.push({ file, importPath });
        }
      }
    }
  }

  if (broken.length === 0) {
    console.log("✅ All @ imports resolved correctly!");
  } else {
    console.log("❌ Broken imports found:\n");
    broken.forEach((b) => {
      console.log(`File: ${b.file}`);
      console.log(`  → Import not found: ${b.importPath}\n`);
    });
  }
}

checkImports();
