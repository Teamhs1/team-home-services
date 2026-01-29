"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { UploadCloud, Loader2 } from "lucide-react";

export default function UnitImageUploader({
  unitId,
  currentImages = [],
  onUploaded,
}) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  async function uploadFiles(files) {
    if (!files.length) return;

    setUploading(true);

    try {
      let finalImages = [...currentImages];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/units/${unitId}/images`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Upload failed");
        }

        // backend devuelve el array final
        finalImages = json.images;
      }

      onUploaded(finalImages);
      toast.success("Images uploaded");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Upload error");
    } finally {
      setUploading(false);
    }
  }

  /* =========================
     Drag & Drop handlers
  ========================= */
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => {
    setDragging(false);
  };

  return (
    <div className="mt-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition
          ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30 hover:border-primary"
          }
        `}
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Uploading images...</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-7 w-7 text-primary mb-2" />
            <p className="text-sm font-medium">Drag & drop unit photos here</p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => uploadFiles(Array.from(e.target.files))}
        />
      </div>
    </div>
  );
}
