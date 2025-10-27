"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import FileUpload from "@/components/FileUpload";

export default function JobPhotos({ jobId, clerkId, readOnly = false }) {
  const [photos, setPhotos] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetPreview, setResetPreview] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/job-photos?jobId=${jobId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load photos");
        setPhotos(data || []);
      } catch (err) {
        console.error("❌ Error fetching photos:", err.message);
        toast.error("Failed to load photos");
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, [jobId]);

  const handleUploadAll = async (type = "before") => {
    if (readOnly) return; // 👈 Bloquea subida si es solo lectura
    if (newImages.length === 0) {
      toast.warning("Selecciona al menos una imagen primero");
      return;
    }

    try {
      setUploading(true);
      for (const file of newImages) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("jobId", jobId);
        formData.append("uploadedBy", clerkId);
        formData.append("type", type);

        const res = await fetch("/api/upload-photo", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        setPhotos((prev) => [...prev, { type, image_url: data.url }]);
      }

      toast.success("📸 Fotos subidas correctamente");
      setNewImages([]);
      setResetPreview((prev) => !prev);
    } catch (err) {
      console.error("❌ Upload failed:", err.message);
      toast.error("Error subiendo fotos: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (photo) => {
    if (readOnly) return; // 👈 Evita eliminar si es solo lectura
    try {
      const res = await fetch(`/api/delete-photo?url=${photo.image_url}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPhotos((prev) =>
          prev.filter((p) => p.image_url !== photo.image_url)
        );
        toast.success("🗑️ Foto eliminada");
      } else {
        toast.error("No se pudo eliminar la foto");
      }
    } catch (err) {
      console.error("Error al eliminar foto:", err.message);
      toast.error("Error eliminando foto");
    }
  };

  return (
    <div className="mt-0 p-0">
      {/* 🧱 Dropzone + Slider */}
      <div className="aspect-square w-full overflow-hidden rounded-xl">
        <FileUpload
          setImages={setNewImages}
          imageList={photos.map((p) => ({ url: p.image_url }))}
          onRemoveImage={!readOnly ? handleRemoveImage : undefined}
          resetPreviewTrigger={resetPreview}
        />
      </div>

      {/* 🚀 Botón para subir nuevas imágenes (solo si no es lectura) */}
      {!readOnly && (
        <div className="mt-4 flex items-center gap-3">
          <Button
            onClick={() => handleUploadAll("before")}
            disabled={uploading || newImages.length === 0}
            className="flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Subir fotos
              </>
            )}
          </Button>
        </div>
      )}

      {/* 🔄 Estado de carga */}
      {loading && (
        <div className="flex items-center justify-center h-24 text-gray-400 text-sm italic">
          <Loader2 className="animate-spin w-4 h-4 mr-2" />
          Cargando fotos...
        </div>
      )}
    </div>
  );
}
