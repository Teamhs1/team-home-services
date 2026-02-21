// components/job-upload/CategoryBlock.jsx

"use client";
import { ImageIcon } from "lucide-react";
export default function CategoryBlock({
  icon: Icon,
  label,
  categoryKey,
  photos,
  onClick,
  setPhotosByCategory,
  setLocalFiles,
}) {
  return (
    <div className="flex flex-col items-center space-y-3">
      <button
        onClick={onClick}
        className="
          flex flex-col items-center justify-center 
          w-28 h-28 rounded-xl border border-gray-300 dark:border-gray-700 
          bg-white dark:bg-gray-800 transition relative shadow-sm
        "
      >
        {Icon ? (
          <Icon className="w-6 h-6 text-primary mb-1" />
        ) : (
          <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
        )}
        <span className="text-sm font-medium">{label}</span>

        {photos?.length > 0 && (
          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
            {photos.length}
          </span>
        )}
      </button>

      {photos?.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2 w-28">
          {photos.map((f, i) => (
            <div key={i} className="relative w-full aspect-square">
              <img
                src={f.url}
                alt={f.name}
                className="w-full h-full object-cover rounded-lg border"
              />

              <button
                onClick={() => {
                  setPhotosByCategory((prev) => ({
                    ...prev,
                    [categoryKey]: prev[categoryKey].filter(
                      (_, idx) => idx !== i,
                    ),
                  }));

                  setLocalFiles((prev) => ({
                    ...prev,
                    [categoryKey]: prev[categoryKey].filter(
                      (_, idx) => idx !== i,
                    ),
                  }));
                }}
                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
