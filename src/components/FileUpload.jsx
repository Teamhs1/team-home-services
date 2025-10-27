import React, { useState, useEffect } from "react";
import Slider from "@/components/Slider";

function FileUpload({
  setImages,
  imageList,
  onRemoveImage,
  resetPreviewTrigger,
}) {
  const [imagePreview, setImagePreview] = useState([]);

  // 🧹 Si se activa la prop resetPreviewTrigger, limpia previews
  useEffect(() => {
    if (resetPreviewTrigger) {
      setImagePreview([]);
    }
  }, [resetPreviewTrigger]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setImages(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  return (
    <div className="w-full">
      {/* 📁 Dropzone visible solo si no hay previews ni imágenes */}
      {imageList.length === 0 && imagePreview.length === 0 && (
        <div className="flex w-full items-center justify-center">
          <label
            htmlFor="dropzone-file"
            className="flex h-28 w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition dark:bg-gray-700 shadow-sm"
          >
            <div className="flex flex-col items-center justify-center py-3">
              <svg
                className="mb-2 h-6 w-6 text-gray-500 dark:text-gray-400"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5A5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                />
              </svg>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag &
                drop
              </p>
              <p className="text-[10px] text-gray-400">
                JPG, PNG, GIF (max 10MB)
              </p>
            </div>
            <input
              id="dropzone-file"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept="image/png, image/gif, image/jpeg"
            />
          </label>
        </div>
      )}

      {/* 🖼️ Slider de imágenes (previews o subidas) */}
      <div className="mt-3 aspect-square w-full overflow-hidden rounded-xl">
        <Slider
          imageList={
            imagePreview.length > 0
              ? imagePreview.map((url) => ({ url }))
              : imageList.map((img) => ({ url: img.url }))
          }
          mini={true}
          disableFullscreen={false}
        />
      </div>
    </div>
  );
}

export default FileUpload;
