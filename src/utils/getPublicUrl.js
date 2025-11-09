import { createClient } from "@supabase/supabase-js";

/**
 * 🔧 Helper para generar URLs públicas válidas desde Supabase Storage.
 * Corrige paths relativos, duplicados o faltantes automáticamente.
 */
export const getPublicUrl = (photoPath) => {
  if (!photoPath) return null;

  // ✅ Si ya es una URL completa, devuélvela directo
  if (photoPath.startsWith("http")) return photoPath;

  // ✅ Normaliza el path, elimina "job-photos/" si está duplicado
  const cleanPath = photoPath.replace(/^job-photos\//, "").trim();

  // ✅ Crea cliente Supabase (anónimo)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // ✅ Genera URL pública con fallback manual si algo falla
  const { data } = supabase.storage.from("job-photos").getPublicUrl(cleanPath);
  const publicUrl =
    data?.publicUrl ||
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/job-photos/${cleanPath}`;

  return publicUrl;
};
