"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import Slider from "@/components/Slider";

// ✅ Función para normalizar URLs seguras desde Supabase
const getPublicUrl = (path) => {
  if (!path) return "";
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Limpia prefijo y codifica cada segmento
  const clean = path.replace(/^\/?job-photos\//, "").trim();
  const encoded = clean
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${base}/storage/v1/object/public/job-photos/${encoded}`;
};

export default function JobPhotos({ jobId, readOnly = false }) {
  const [groupedPhotos, setGroupedPhotos] = useState({
    before: [],
    after: [],
    general: [],
  });
  const [newImages, setNewImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar fotos existentes desde la API
  useEffect(() => {
    if (!jobId) return;

    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/job-photos/list?job_id=${jobId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to load photos");

        console.log("🖼️ Fotos agrupadas:", data.data);
        setGroupedPhotos(data.data || { before: [], after: [], general: [] });
      } catch (err) {
        console.error("❌ Error fetching photos:", err.message);
        toast.error("No se pudieron cargar las fotos");
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [jobId]);

  // 🔹 Subir fotos vía API
  const handleUpload = async (category) => {
    try {
      setUploading(true);

      for (const file of newImages) {
        const safeName = encodeURIComponent(file.name.replace(/\s+/g, "_"));
        const timestamp = Date.now();
        const path = `${jobId}/${category}/${timestamp}_${safeName}`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", path);
        formData.append("job_id", jobId);
        formData.append("category", category);
        formData.append("uploaded_by", "admin"); // opcional

        // 🔹 Subir fotos vía API (con autenticación Clerk)
        const handleUpload = async (category) => {
          try {
            setUploading(true);

            // 🔑 Obtener token de Clerk (para autorizar subida)
            const token = await window.Clerk?.session?.getToken({
              template: "supabase",
            });
            if (!token)
              throw new Error("No se pudo obtener token de autenticación");

            for (const file of newImages) {
              const safeName = encodeURIComponent(
                file.name.replace(/\s+/g, "_")
              );
              const timestamp = Date.now();
              const path = `${jobId}/${category}/${timestamp}_${safeName}`;

              const formData = new FormData();
              formData.append("file", file);
              formData.append("path", path);
              formData.append("job_id", jobId);
              formData.append("category", category);

              const res = await fetch("/api/job-photos/upload", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`, // ✅ se envía token aquí
                },
                body: formData,
              });

              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Upload failed");

              setGroupedPhotos((prev) => ({
                ...prev,
                [category]: [...(prev[category] || []), data.photo],
              }));
            }

            toast.success(`Fotos ${category} subidas correctamente`);
          } catch (err) {
            console.error("❌ Error al subir:", err.message);
            toast.error(err.message);
          } finally {
            setUploading(false);
          }
        };

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        setGroupedPhotos((prev) => ({
          ...prev,
          [category]: [...(prev[category] || []), data.photo],
        }));
      }

      toast.success(`Fotos ${category} subidas correctamente`);
    } catch (err) {
      console.error("❌ Error al subir:", err.message);
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  // 🔹 Eliminar foto
  const handleRemoveImage = async (photo, category) => {
    if (readOnly) return;

    try {
      const res = await fetch("/api/job-photos/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: photo.image_url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");

      setGroupedPhotos((prev) => ({
        ...prev,
        [category]: prev[category].filter(
          (p) => p.image_url !== photo.image_url
        ),
      }));

      toast.success("🗑️ Foto eliminada correctamente");
    } catch (err) {
      console.error("❌ Error al eliminar foto:", err.message);
      toast.error("Error eliminando foto");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm italic">
        <Loader2 className="animate-spin w-4 h-4 mr-2" />
        Cargando fotos...
      </div>
    );

  return (
    <div className="mt-4 space-y-6">
      {/* 🧱 Tabs por categoría */}
      <Tabs defaultValue="before" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="before">
            Before ({groupedPhotos.before.length})
          </TabsTrigger>
          <TabsTrigger value="after">
            After ({groupedPhotos.after.length})
          </TabsTrigger>
          <TabsTrigger value="general">
            General ({groupedPhotos.general.length})
          </TabsTrigger>
        </TabsList>

        {/* BEFORE */}
        <TabsContent value="before">
          <Slider
            imageList={groupedPhotos.before.map((p) =>
              getPublicUrl(p.image_url || p.file_path || p.path)
            )}
            mini
          />
          {!readOnly && (
            <div className="mt-3">
              <Button
                onClick={() => handleUpload("before")}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Subir Before
              </Button>
            </div>
          )}
        </TabsContent>

        {/* AFTER */}
        <TabsContent value="after">
          <Slider
            imageList={groupedPhotos.after.map((p) =>
              getPublicUrl(p.image_url || p.file_path || p.path)
            )}
            mini
          />
          {!readOnly && (
            <div className="mt-3">
              <Button
                onClick={() => handleUpload("after")}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Subir After
              </Button>
            </div>
          )}
        </TabsContent>

        {/* GENERAL */}
        <TabsContent value="general">
          <Slider
            imageList={groupedPhotos.general.map((p) =>
              getPublicUrl(p.image_url || p.file_path || p.path)
            )}
            mini
          />
          {!readOnly && (
            <div className="mt-3">
              <Button
                onClick={() => handleUpload("general")}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Subir General
              </Button>
            </div>
          )}
        </TabsContent>
        {/* 🕒 Job Activity Log */}
        <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            🧾 Job Activity Log
          </h3>
          <ActivityLog jobId={jobId} />
        </div>
      </Tabs>
    </div>
  );
}
