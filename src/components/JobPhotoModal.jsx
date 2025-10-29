"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";

export default function JobPhotoModal({
  open,
  onClose,
  jobId,
  type,
  onConfirm,
  getToken,
}) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);

  if (!open) return null;

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    const token = await getToken({ template: "supabase" });
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    for (const file of files) {
      const path = `${jobId}/${type}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from("job_photos")
        .upload(path, file);
      if (!error) setPhotos((prev) => [...prev, { name: file.name, path }]);
    }

    setUploading(false);
  }

  async function handleConfirm() {
    if (!photos.length) return;
    await onConfirm(jobId, type, photos);
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 relative"
        >
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <X size={20} />
          </button>

          <h2 className="text-lg font-semibold mb-4">
            {type === "before"
              ? "Upload Photos Before Starting"
              : "Upload Photos After Completion"}
          </h2>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="mb-4 block w-full text-sm"
          />

          <div className="grid grid-cols-3 gap-2 mb-4">
            {photos.map((p, i) => (
              <img
                key={i}
                src={URL.createObjectURL(e.target?.files?.[i] || new Blob())}
                alt="preview"
                className="w-full h-24 object-cover rounded-md border"
              />
            ))}
          </div>

          <Button
            className="w-full"
            disabled={!photos.length || uploading}
            onClick={handleConfirm}
          >
            {uploading ? "Uploading..." : "Confirm"}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
